import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FREE_MONTHLY_LIMIT = 2;

export const getQuotaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [readingsRes, profileRes] = await Promise.all([
      supabase
        .from("readings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", start.toISOString()),
      supabase
        .from("profiles")
        .select("paid_credits")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (readingsRes.error) throw new Error(readingsRes.error.message);
    const used = readingsRes.count ?? 0;
    const paidCredits = profileRes.data?.paid_credits ?? 0;
    const freeRemaining = Math.max(0, FREE_MONTHLY_LIMIT - used);

    return {
      used,
      limit: FREE_MONTHLY_LIMIT,
      remaining: freeRemaining,
      paidCredits,
      needsPayment: freeRemaining === 0 && paidCredits === 0,
    };
  });

const RecordInput = z.object({
  readingType: z.string().min(1).max(50),
  readingName: z.string().min(1).max(100),
});

export const recordReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RecordInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Usamos admin para poder descontar créditos (RLS de profiles bloquea
    // que el propio usuario edite paid_credits). Seguro: la fn está
    // protegida por requireSupabaseAuth y todas las escrituras se acotan
    // a context.userId.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabaseAdmin
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString());
    if (countErr) throw new Error(countErr.message);

    const used = count ?? 0;
    const needsPaidCredit = used >= FREE_MONTHLY_LIMIT;
    let wasPaid = false;

    if (needsPaidCredit) {
      const { data: profile, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("paid_credits")
        .eq("id", userId)
        .maybeSingle();
      if (profErr) throw new Error(profErr.message);
      const credits = profile?.paid_credits ?? 0;
      if (credits <= 0) throw new Error("NO_CREDITS");

      const { error: decErr } = await supabaseAdmin
        .from("profiles")
        .update({ paid_credits: credits - 1 })
        .eq("id", userId);
      if (decErr) throw new Error(decErr.message);
      wasPaid = true;
    }

    const { error } = await supabaseAdmin.from("readings").insert({
      user_id: userId,
      reading_type: data.readingType,
      reading_name: data.readingName,
      was_paid: wasPaid,
    });
    if (error) throw new Error(error.message);

    return { ok: true, wasPaid };
  });

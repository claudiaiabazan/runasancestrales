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
    const { supabase, userId } = context;

    // Recalcular cuota para decidir si consumir crédito pago
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString());

    const used = count ?? 0;
    const needsPaidCredit = used >= FREE_MONTHLY_LIMIT;
    let wasPaid = false;

    if (needsPaidCredit) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("paid_credits")
        .eq("id", userId)
        .maybeSingle();
      const credits = profile?.paid_credits ?? 0;
      if (credits <= 0) throw new Error("NO_CREDITS");

      const { error: decErr } = await supabase
        .from("profiles")
        .update({ paid_credits: credits - 1 })
        .eq("id", userId);
      if (decErr) throw new Error(decErr.message);
      wasPaid = true;
    }

    const { error } = await supabase.from("readings").insert({
      user_id: userId,
      reading_type: data.readingType,
      reading_name: data.readingName,
      was_paid: wasPaid,
    });
    if (error) throw new Error(error.message);

    return { ok: true, wasPaid };
  });

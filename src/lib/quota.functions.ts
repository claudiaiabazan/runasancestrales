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
    const { count, error } = await supabase
      .from("readings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString());
    if (error) throw new Error(error.message);
    const used = count ?? 0;
    return {
      used,
      limit: FREE_MONTHLY_LIMIT,
      remaining: Math.max(0, FREE_MONTHLY_LIMIT - used),
      needsPayment: used >= FREE_MONTHLY_LIMIT,
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
    const { error } = await supabase.from("readings").insert({
      user_id: userId,
      reading_type: data.readingType,
      reading_name: data.readingName,
      was_paid: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

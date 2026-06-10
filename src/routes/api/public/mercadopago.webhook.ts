import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
          console.error("[mp-webhook] missing token");
          return new Response("config", { status: 500 });
        }

        let payload: any = null;
        try {
          payload = await request.json();
        } catch {
          return new Response("bad json", { status: 400 });
        }

        // MP envía: { action: "payment.created", type: "payment", data: { id: "..." } }
        // o querystring ?type=payment&data.id=...
        const url = new URL(request.url);
        const qsType = url.searchParams.get("type");
        const qsId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

        const type = payload?.type ?? qsType;
        const paymentId = String(payload?.data?.id ?? qsId ?? "");

        if (type !== "payment" || !paymentId) {
          // Otros eventos (merchant_order, etc) los aceptamos sin hacer nada.
          return new Response("ignored", { status: 200 });
        }

        // 1. Traer el pago desde MP para validar estado y monto
        const mpRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!mpRes.ok) {
          console.error("[mp-webhook] fetch payment failed", mpRes.status);
          return new Response("mp fetch failed", { status: 200 });
        }
        const payment = (await mpRes.json()) as {
          id: number;
          status: string;
          transaction_amount: number;
          external_reference: string | null;
          metadata: Record<string, unknown> | null;
          preference_id?: string;
        };

        if (payment.status !== "approved") {
          // Pago no aprobado: lo registramos pero no acreditamos
          return new Response("not approved", { status: 200 });
        }

        const userId =
          (payment.metadata?.user_id as string | undefined) ??
          payment.external_reference ??
          null;
        if (!userId) {
          console.error("[mp-webhook] no user id in payment", payment.id);
          return new Response("no user", { status: 200 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // 2. Idempotencia: insertar; si ya existe, salir sin sumar crédito
        const { error: insertErr } = await supabaseAdmin
          .from("mp_payments")
          .insert({
            user_id: userId,
            mp_payment_id: String(payment.id),
            preference_id: payment.preference_id ?? null,
            status: payment.status,
            amount: payment.transaction_amount,
            raw: payment as any,
          });

        if (insertErr) {
          // Probablemente duplicado por unique en mp_payment_id → ya estaba acreditado
          if ((insertErr as any).code === "23505") {
            return new Response("duplicate", { status: 200 });
          }
          console.error("[mp-webhook] insert error", insertErr);
          return new Response("db error", { status: 500 });
        }

        // 3. Acreditar 1 lectura paga al usuario
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("paid_credits")
          .eq("id", userId)
          .maybeSingle();

        const current = profile?.paid_credits ?? 0;
        const { error: updErr } = await supabaseAdmin
          .from("profiles")
          .update({ paid_credits: current + 1 })
          .eq("id", userId);

        if (updErr) {
          console.error("[mp-webhook] credit update error", updErr);
          return new Response("credit error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});

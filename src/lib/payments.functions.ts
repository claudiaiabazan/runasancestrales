import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const READING_PRICE_ARS = 2000;

const Input = z.object({
  readingType: z.string().min(1).max(50),
  readingName: z.string().min(1).max(100),
});

/**
 * Crea una preferencia de pago en Mercado Pago y devuelve la URL de checkout.
 */
export const createMercadoPagoPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");

    const isTest = accessToken.startsWith("TEST-");

    // Build absolute base URL. Preferimos PUBLIC_SITE_URL (estable, p.ej.
    // https://runasancestrales.lovable.app) porque las URLs de preview de
    // Lovable cambian y MP rechaza/rompe el redirect de vuelta.
    const host = getRequestHeader("host") ?? "";
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const requestOrigin = host ? `${proto}://${host}` : "";
    const isPreviewHost =
      host.includes("lovableproject.com") || host.includes("lovable.dev");
    const origin =
      process.env.PUBLIC_SITE_URL ||
      (isPreviewHost ? "https://runasancestrales.lovable.app" : requestOrigin);


    const body = {
      items: [
        {
          id: data.readingType,
          title: `Lectura de runas: ${data.readingName}`,
          description: "Una consulta adicional al oráculo de runas",
          quantity: 1,
          unit_price: READING_PRICE_ARS,
          currency_id: "ARS",
        },
      ],
      external_reference: context.userId,
      metadata: {
        user_id: context.userId,
        reading_type: data.readingType,
      },
      back_urls: {
        success: `${origin}/oraculo/${data.readingType}?paid=1`,
        failure: `${origin}/oraculo/${data.readingType}?paid=0`,
        pending: `${origin}/oraculo/${data.readingType}?paid=pending`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mercadopago/webhook`,
      statement_descriptor: "ORACULO RUNAS",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("MP preference error", res.status, txt);
      throw new Error("MP_PREFERENCE_FAILED");
    }

    const pref = (await res.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    return {
      preferenceId: pref.id,
      checkoutUrl: isTest ? pref.sandbox_init_point : pref.init_point,
      isTest,
    };
  });

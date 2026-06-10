import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { READINGS } from "@/data/readings";
import { getQuotaStatus } from "@/lib/quota.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/oraculo/")({
  head: () => ({
    meta: [
      { title: "El Oráculo · Elige tu tirada" },
      { name: "description", content: "Cuatro tiradas rúnicas: Tres Nornas, Cruz Celta, Árbol de la Vida y Pareja. Elige el camino para consultar al oráculo." },
    ],
  }),
  component: OraculoIndex,
});

function OraculoIndex() {
  const { user } = useAuth();
  const fetchQuota = useServerFn(getQuotaStatus);
  const [paymentBanner, setPaymentBanner] = useState<"success" | "pending" | "failure" | null>(null);
  const [awaitingCredit, setAwaitingCredit] = useState(false);
  const [creditTimeout, setCreditTimeout] = useState(false);

  const quotaQuery = useQuery({
    queryKey: ["quota", user?.id],
    queryFn: () => fetchQuota(),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: awaitingCredit ? 2000 : false,
  });

  // Detect return from Mercado Pago via ?paid=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid === "1") {
      setPaymentBanner("success");
      setAwaitingCredit(true);
    } else if (paid === "pending") setPaymentBanner("pending");
    else if (paid === "0") setPaymentBanner("failure");
    if (paid !== null) {
      const url = new URL(window.location.href);
      ["paid","payment_id","status","external_reference","merchant_order_id","preference_id","site_id","processing_mode","merchant_account_id","collection_id","collection_status"].forEach(k => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  useEffect(() => {
    if (!awaitingCredit) return;
    if (quotaQuery.data && !quotaQuery.data.needsPayment) {
      setAwaitingCredit(false);
      setCreditTimeout(false);
      return;
    }
    const t = setTimeout(() => {
      setAwaitingCredit(false);
      setCreditTimeout(true);
    }, 30_000);
    return () => clearTimeout(t);
  }, [awaitingCredit, quotaQuery.data]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      {/* Acreditando pago */}
      {awaitingCredit && (
        <div className="mb-8 mx-auto max-w-2xl rounded-lg border border-gold/40 bg-primary/15 px-5 py-5 text-center animate-fade-in">
          <p className="font-display text-3xl text-gold text-glow animate-pulse">ᚠ</p>
          <p className="mt-3 font-display text-xs uppercase tracking-[0.25em] text-gold">
            Acreditando tu pago
          </p>
          <p className="mt-2 text-sm font-body italic text-muted-foreground">
            Mercado Pago está confirmando la transacción. En unos segundos vas a poder elegir tu tirada.
          </p>
          <div className="mt-4 flex justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {!awaitingCredit && paymentBanner && (
        <div className="mb-8 mx-auto max-w-2xl rounded-lg border px-5 py-4 text-center animate-fade-in"
          style={{
            borderColor: paymentBanner === "failure" ? "hsl(var(--destructive) / 0.5)" : undefined,
          }}
        >
          <p className="font-display text-xs uppercase tracking-[0.25em] text-gold">
            {paymentBanner === "success" && "✦ Pago recibido ✦"}
            {paymentBanner === "pending" && "Pago pendiente"}
            {paymentBanner === "failure" && "El pago no se completó"}
          </p>
          <p className="mt-2 text-sm font-body italic text-muted-foreground">
            {paymentBanner === "success" && "Tu lectura está desbloqueada. Elegí una tirada para comenzar."}
            {paymentBanner === "pending" && "Cuando Mercado Pago confirme, vas a poder elegir tu tirada."}
            {paymentBanner === "failure" && "Podés intentar nuevamente cuando quieras."}
          </p>
          {creditTimeout && paymentBanner === "success" && quotaQuery.data?.needsPayment && (
            <button
              onClick={() => { setCreditTimeout(false); setAwaitingCredit(true); quotaQuery.refetch(); }}
              className="mt-3 rounded-md border border-gold/50 bg-primary/30 px-5 py-2 font-display text-[0.7rem] uppercase tracking-[0.25em] text-gold hover:bg-primary/50"
            >
              Reintentar
            </button>
          )}
          <button
            onClick={() => setPaymentBanner(null)}
            className="mt-3 block mx-auto text-[0.65rem] uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="text-center">
        <p className="font-display text-xs tracking-[0.4em] uppercase text-gold/80">El oráculo</p>
        <h1 className="mt-3 font-display text-4xl text-secondary text-glow-soft md:text-5xl">
          Elige el camino de tu consulta
        </h1>
        <p className="mt-4 font-body text-lg italic text-muted-foreground">
          Respira. Aquieta tu mente. Formula tu pregunta antes de continuar.
        </p>
        <div className="ceremonial-divider mx-auto mt-8 w-40" />
      </div>

      <div className="mt-10 mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl text-gold">Cómo consultar el oráculo</h2>
        <ol className="mt-6 list-decimal list-inside space-y-3 marker:text-gold/70 font-body text-lg leading-relaxed text-foreground/85">
          <li>Elegí una tirada acorde a tu consulta en el portal del oráculo.</li>
          <li>Si lo deseás, escribí tu pregunta para personalizar el relato.</li>
          <li>Revelá las runas, una por una, observando su posición en la tirada.</li>
          <li>Leé la síntesis del oráculo y el hilo del relato que se entreteje.</li>
        </ol>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {READINGS.map((r) => (
          <Link
            key={r.id}
            to="/oraculo/$type"
            params={{ type: r.id }}
            className="group relative overflow-hidden rounded-xl border border-gold/30 bg-card/50 p-7 backdrop-blur-sm transition-all hover:border-gold/70 hover:bg-card/80 rune-glow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl tracking-wide text-secondary group-hover:text-gold group-hover:text-glow transition">
                  {r.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-4 font-body italic text-foreground/80">{r.longDescription}</p>
              </div>
              <span className="font-display text-3xl text-gold/70 group-hover:text-gold transition">
                {r.runesRequired}
              </span>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-widest">
              <span className="text-muted-foreground">{r.runesRequired} runas</span>
              <span className="text-gold transition group-hover:translate-x-1">Iniciar →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

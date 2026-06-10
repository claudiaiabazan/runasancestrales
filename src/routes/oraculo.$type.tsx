import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getReading, type ReadingPosition } from "@/data/readings";
import { RUNES, getRune, type Rune } from "@/data/runes";
import { RuneStone } from "@/components/RuneStone";
import { FlippableRune } from "@/components/FlippableRune";
import { saveReading } from "@/lib/storage";
import { generateOracleNarrative } from "@/lib/oracle.functions";
import { getQuotaStatus, recordReading, FREE_MONTHLY_LIMIT } from "@/lib/quota.functions";
import { createMercadoPagoPreference, READING_PRICE_ARS } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/oraculo/$type")({
  loader: ({ params }) => {
    const reading = getReading(params.type);
    if (!reading) throw notFound();
    return { reading };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.reading.name} · Tirada de Runas` },
      { name: "description", content: loaderData?.reading.description },
    ],
  }),
  component: OracleReading,
});

interface PlacedRune {
  runeId: string;
  positionIndex: number;
}

function shuffleDeck(): string[] {
  const ids = RUNES.map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function OracleReading() {
  const { reading } = Route.useLoaderData();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fetchQuota = useServerFn(getQuotaStatus);
  const recordReadingFn = useServerFn(recordReading);
  const createPaymentFn = useServerFn(createMercadoPagoPreference);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [awaitingCredit, setAwaitingCredit] = useState(false);
  const [creditTimeout, setCreditTimeout] = useState(false);
  const quotaQuery = useQuery({
    queryKey: ["quota", user?.id],
    queryFn: () => fetchQuota(),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: awaitingCredit ? 2000 : false,
  });

  const [deck, setDeck] = useState<string[]>(() => shuffleDeck());
  const [placed, setPlaced] = useState<PlacedRune[]>([]);
  const [revealedCount, setRevealedCount] = useState(0); // how many are flipped face-up
  const [activeRuneId, setActiveRuneId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<"success" | "pending" | "failure" | null>(null);

  // Detect return from Mercado Pago via ?paid=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid === "1") {
      setPaymentBanner("success");
      setAwaitingCredit(true); // start polling until webhook credits the user
    } else if (paid === "pending") setPaymentBanner("pending");
    else if (paid === "0") setPaymentBanner("failure");
    if (paid !== null) {
      quotaQuery.refetch();
      const url = new URL(window.location.href);
      ["paid","payment_id","status","external_reference","merchant_order_id","preference_id","site_id","processing_mode","merchant_account_id","collection_id","collection_status"].forEach(k => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.pathname);
    }
  }, []); // eslint-disable-line

  // Stop polling when credit lands; bail out after ~30s with a manual retry hint
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


  const allPlaced = placed.length === reading.runesRequired;
  const allRevealed = revealedCount === reading.runesRequired;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  // Auto-flip runes one by one when complete
  useEffect(() => {
    if (!allPlaced) return;
    if (revealedCount >= reading.runesRequired) return;
    const t = setTimeout(() => {
      setRevealedCount((c) => c + 1);
    }, revealedCount === 0 ? 700 : 900);
    return () => clearTimeout(t);
  }, [allPlaced, revealedCount, reading.runesRequired]);

  // Save once fully revealed
  useEffect(() => {
    if (!allRevealed) return;
    saveReading({
      readingId: reading.id,
      readingName: reading.name,
      runes: placed.map((p) => ({
        runeId: p.runeId,
        positionName: reading.positions[p.positionIndex].name,
      })),
    });
    if (placed.length > 0 && activeRuneId === null) {
      setActiveRuneId(placed[0].runeId);
    }
  }, [allRevealed]); // eslint-disable-line

  function handlePick(runeId: string) {
    if (allPlaced) return;
    if (placed.find((p) => p.runeId === runeId)) return;
    setPlaced((prev) => [...prev, { runeId, positionIndex: prev.length }]);
  }

  async function handleConfirmQuestion(q: string) {
    // Record reading in DB (counts against monthly quota)
    try {
      await recordReadingFn({
        data: { readingType: reading.id, readingName: reading.name },
      });
      quotaQuery.refetch();
    } catch (e) {
      console.error("Failed to record reading", e);
    }
    setSubmittedQuestion(q);
  }

  function reset() {
    setDeck(shuffleDeck());
    setPlaced([]);
    setRevealedCount(0);
    setActiveRuneId(null);
    setQuestion("");
    setSubmittedQuestion(null);
  }

  // Auth gate
  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-5xl text-gold text-glow">ᚱ</p>
        <p className="mt-4 text-sm text-muted-foreground italic">Preparando el altar...</p>
      </div>
    );
  }

  // Paywall when monthly quota is exhausted (and no reading in progress)
  if (quotaQuery.data?.needsPayment && submittedQuestion === null) {
    async function handlePay() {
      setPayError(null);
      setPayLoading(true);
      try {
        const res = await createPaymentFn({
          data: { readingType: reading.id, readingName: reading.name },
        });
        window.location.href = res.checkoutUrl;
      } catch (e) {
        console.error(e);
        setPayError("No pudimos iniciar el pago. Probá de nuevo en unos segundos.");
        setPayLoading(false);
      }
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <Link to="/oraculo" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
          ← Cambiar tirada
        </Link>
        <p className="mt-6 font-display text-5xl text-gold text-glow">ᚺ</p>
        <h1 className="mt-4 font-display text-2xl tracking-[0.2em] uppercase text-secondary">
          Llegaste al umbral
        </h1>
        <p className="mt-4 font-body italic text-muted-foreground">
          Ya consultaste tus <strong className="text-gold">{FREE_MONTHLY_LIMIT} lecturas gratis</strong> de este mes.
          Para continuar, podés desbloquear una lectura adicional por <strong className="text-gold">${READING_PRICE_ARS.toLocaleString("es-AR")} ARS</strong>.
        </p>
        <button
          onClick={handlePay}
          disabled={payLoading}
          className="mt-8 rounded-md border border-gold/50 bg-primary/30 px-6 py-3 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/50 disabled:opacity-50 disabled:cursor-wait"
        >
          {payLoading ? "Abriendo Mercado Pago..." : `Pagar $${READING_PRICE_ARS.toLocaleString("es-AR")} con Mercado Pago`}
        </button>
        {payError && (
          <p className="mt-3 text-xs text-destructive">{payError}</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Pago seguro vía Mercado Pago. Tu cuota gratis se renueva el primer día del próximo mes.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Lecturas usadas este mes: <span className="text-gold">{quotaQuery.data.used} / {FREE_MONTHLY_LIMIT}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {/* Payment return banner */}
      {paymentBanner && (
        <div
          className={cn(
            "mb-6 mx-auto max-w-2xl rounded-lg border px-5 py-4 text-center animate-fade-in",
            paymentBanner === "success" && "border-gold/50 bg-primary/20 text-gold",
            paymentBanner === "pending" && "border-gold/30 bg-card/40 text-secondary",
            paymentBanner === "failure" && "border-destructive/50 bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-display text-xs uppercase tracking-[0.25em]">
            {paymentBanner === "success" && "✦ Pago recibido ✦"}
            {paymentBanner === "pending" && "Pago pendiente de acreditación"}
            {paymentBanner === "failure" && "El pago no se completó"}
          </p>
          <p className="mt-2 text-sm font-body italic text-muted-foreground">
            {paymentBanner === "success" && "Tu lectura adicional está desbloqueada."}
            {paymentBanner === "pending" && "En cuanto Mercado Pago confirme, vas a poder iniciar la lectura."}
            {paymentBanner === "failure" && "Podés intentar nuevamente cuando quieras."}
          </p>
          {paymentBanner === "success" && (
            <button
              onClick={() => {
                setPaymentBanner(null);
                document.getElementById("question-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                document.getElementById("question-textarea")?.focus({ preventScroll: true });
              }}
              className="mt-4 rounded-md border border-gold/50 bg-primary/30 px-6 py-2.5 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/50"
            >
              Comenzar lectura
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

      {/* Quota badge */}
      {quotaQuery.data && (
        <div className="mb-4 text-center text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
          Lecturas gratis este mes: <span className="text-gold">{quotaQuery.data.used} / {FREE_MONTHLY_LIMIT}</span>
        </div>
      )}



      {/* Header */}
      <div className="mb-8 text-center">

        <Link to="/oraculo" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
          ← Cambiar tirada
        </Link>
        <h1 className="mt-3 font-display text-3xl text-secondary text-glow-soft md:text-4xl">
          {reading.name}
        </h1>
        <p className="mt-2 max-w-2xl mx-auto font-body italic text-muted-foreground">
          {allRevealed
            ? "Las runas han hablado. Toca cada una para escuchar su mensaje."
            : allPlaced
            ? "Las piedras revelan su rostro..."
            : `Selecciona ${reading.runesRequired - placed.length} runa${reading.runesRequired - placed.length === 1 ? "" : "s"} de las que esperan en silencio.`}
        </p>
      </div>

      {/* Spread layout */}
      <div className="mb-10">
        <SpreadLayout
          reading={reading}
          placed={placed}
          revealedCount={revealedCount}
          activeRuneId={activeRuneId}
          onSelectPlaced={(runeId) => allRevealed && setActiveRuneId(runeId)}
        />
      </div>

      {/* Active rune interpretation */}
      {allRevealed && activeRuneId && (
        <ActiveInterpretation
          rune={getRune(activeRuneId)!}
          positionName={
            reading.positions[
              placed.find((p) => p.runeId === activeRuneId)!.positionIndex
            ].name
          }
          positionMeaning={
            reading.positions[
              placed.find((p) => p.runeId === activeRuneId)!.positionIndex
            ].meaning
          }
        />
      )}

      {/* Synthesis summary */}
      {allRevealed && (
        <ReadingSummary
          reading={reading}
          placed={placed}
          question={submittedQuestion}
        />
      )}

      {/* Reset / share row */}
      {allRevealed && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in">
          <button
            onClick={reset}
            className="rounded-md border border-gold/40 bg-primary/20 px-6 py-2.5 font-display text-xs uppercase tracking-widest text-gold hover:bg-primary/40"
          >
            Nueva consulta
          </button>
          <Link
            to="/historial"
            className="rounded-md border border-gold/20 px-6 py-2.5 font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            Ver historial
          </Link>
        </div>
      )}

      {/* Question input */}
      {!allPlaced && submittedQuestion === null && (
        <section id="question-section" className="mt-4 mb-8 max-w-2xl mx-auto scroll-mt-24">
          <div className="rounded-xl border border-gold/25 bg-card/40 backdrop-blur-sm p-5 md:p-6">
            <label className="block font-display text-[0.7rem] uppercase tracking-[0.3em] text-gold/90 text-center">
              Tu pregunta al oráculo <span className="text-muted-foreground normal-case tracking-normal">(opcional)</span>
            </label>
            <p className="mt-2 text-center text-xs italic text-muted-foreground">
              Escribí lo que querés consultar. Las runas tejerán una respuesta para vos.
            </p>
            <textarea
              id="question-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Ej: ¿Qué necesito saber sobre mi camino profesional?"
              className="mt-3 w-full rounded-md border border-gold/30 bg-background/50 px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/70"
            />
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleConfirmQuestion(question.trim() || "")}
                disabled={!question.trim()}
                className="rounded-md border border-gold/50 bg-primary/30 px-5 py-2 font-display text-[0.7rem] uppercase tracking-[0.25em] text-gold hover:bg-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar pregunta
              </button>
              <button
                onClick={() => handleConfirmQuestion("")}
                className="rounded-md border border-gold/20 px-5 py-2 font-display text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
              >
                Saltar (lectura general)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Show submitted question */}
      {submittedQuestion && (
        <div className="mt-4 mb-8 max-w-2xl mx-auto text-center">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.3em] text-gold/70">Tu pregunta</p>
          <p className="mt-1 font-body italic text-secondary/90">"{submittedQuestion}"</p>
        </div>
      )}

      {/* Deck */}
      {!allPlaced && submittedQuestion !== null && (
        <section className="mt-12">
          <div className="mb-6 text-center">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-gold/80">Las 24 runas del Futhark</p>
            <p className="mt-1 text-sm text-muted-foreground">Toca una para entregarla a la tirada</p>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-3 max-w-3xl mx-auto">
            {deck.map((id) => {
              const used = placed.find((p) => p.runeId === id);
              return (
                <button
                  key={id}
                  onClick={() => handlePick(id)}
                  disabled={!!used}
                  className={cn(
                    "group relative aspect-[3/4] transition-all duration-300",
                    used ? "opacity-20 pointer-events-none scale-90" : "hover:-translate-y-1 hover:scale-105 cursor-pointer",
                  )}
                  aria-label={`Elegir runa ${id}`}
                >
                  <RuneStone faceDown size="sm" className={cn("h-full w-full", !used && "group-hover:rune-glow-strong")} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ----- Spread layout -----
function SpreadLayout({
  reading,
  placed,
  revealedCount,
  activeRuneId,
  onSelectPlaced,
}: {
  reading: ReturnType<typeof getReading> extends infer T ? Exclude<T, undefined> : never;
  placed: PlacedRune[];
  revealedCount: number;
  activeRuneId: string | null;
  onSelectPlaced: (runeId: string) => void;
}) {
  // Determine grid bounds from positions
  const { cols, rows, minY } = useMemo(() => {
    const xs = reading.positions.map((p) => p.x);
    const ys = reading.positions.map((p) => p.y);
    return {
      cols: Math.max(...xs),
      rows: Math.max(...ys) - Math.min(...ys) + 1,
      minY: Math.min(...ys),
    };
  }, [reading]);

  return (
    <div
      className="relative mx-auto rounded-xl border border-gold/15 bg-card/20 backdrop-blur-sm p-6 md:p-10"
      style={{ minHeight: "min(70vh, 520px)" }}
    >
      <div
        className="grid mx-auto gap-3 md:gap-5 place-items-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, auto)`,
          maxWidth: `${cols * 130}px`,
        }}
      >
        {reading.positions.map((pos: ReadingPosition, idx: number) => {
          const placement = placed.find((p) => p.positionIndex === idx);
          const isRevealed = placement && placed.findIndex((p) => p.positionIndex === idx) < revealedCount;
          const rune = placement ? getRune(placement.runeId) : null;
          const isActive = placement?.runeId === activeRuneId;

          return (
            <div
              key={idx}
              style={{
                gridColumn: pos.x,
                gridRow: pos.y - minY + 1,
              }}
              className="flex flex-col items-center gap-2"
            >
              {placement && rune ? (
                <button
                  onClick={() => onSelectPlaced(placement.runeId)}
                  className={cn(
                    "transition-transform animate-drop-down",
                    isActive && "scale-110",
                  )}
                  disabled={revealedCount < reading.runesRequired}
                >
                  <FlippableRune
                    glyph={rune.glyph}
                    flipped={!!isRevealed}
                    delayMs={0}
                    size="md"
                    highlight={isActive}
                  />
                </button>
              ) : (
                <div className="w-20 h-28 rounded-lg border border-dashed border-gold/25 bg-card/20" />
              )}
              <p
                className={cn(
                  "font-display text-[0.65rem] uppercase tracking-[0.18em] text-center",
                  isActive ? "text-gold text-glow-soft" : "text-muted-foreground",
                )}
              >
                {pos.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----- Interpretation panel -----
function ActiveInterpretation({
  rune,
  positionName,
  positionMeaning,
}: {
  rune: Rune;
  positionName: string;
  positionMeaning: string;
}) {
  return (
    <article
      key={rune.id}
      className="mt-10 grid gap-8 md:grid-cols-[200px_1fr] rounded-xl border border-gold/30 bg-card/50 p-6 md:p-10 backdrop-blur-sm rune-glow animate-fade-in"
    >
      <div className="flex flex-col items-center text-center">
        <span className="font-display text-9xl text-gold text-glow leading-none animate-flip-in">
          {rune.glyph}
        </span>
        <h2 className="mt-4 font-display text-2xl tracking-wider text-secondary">{rune.name}</h2>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-1">
          /{rune.phonetic}/
        </p>
        <p className="mt-2 font-body italic text-sm text-foreground/70">{rune.literal}</p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="font-display text-[0.7rem] uppercase tracking-[0.3em] text-gold/80">
            Posición · {positionName}
          </p>
          <p className="mt-1 font-body italic text-foreground/85">{positionMeaning}</p>
        </div>

        <div className="ceremonial-divider" />

        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-gold mb-2">Interpretación</h3>
          <p className="text-foreground/90 leading-relaxed">{rune.divinatory}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-accent/30 bg-accent/10 p-4">
            <p className="font-display text-xs uppercase tracking-widest text-accent mb-1">Positivo</p>
            <p className="text-sm text-foreground/85">{rune.positive}</p>
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
            <p className="font-display text-xs uppercase tracking-widest text-destructive mb-1">Sombra</p>
            <p className="text-sm text-foreground/85">{rune.negative}</p>
          </div>
        </div>

        <blockquote className="border-l-2 border-gold/60 pl-4 font-body text-lg italic text-secondary/90">
          “{rune.message}”
          <footer className="mt-2 text-xs not-italic uppercase tracking-widest text-muted-foreground">
            — Mensaje de {rune.name}
          </footer>
        </blockquote>
      </div>
    </article>
  );
}

// ----- Reading synthesis summary -----
function ReadingSummary({
  reading,
  placed,
  question,
}: {
  reading: ReturnType<typeof getReading> extends infer T ? Exclude<T, undefined> : never;
  placed: PlacedRune[];
  question: string | null;
}) {
  const callAi = useServerFn(generateOracleNarrative);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const hasQuestion = !!question && question.trim().length > 0;

  useEffect(() => {
    if (!hasQuestion) return;
    let cancelled = false;
    setAiLoading(true);
    setAiError(null);
    setAiNarrative(null);
    callAi({
      data: {
        question: question!.trim(),
        readingName: reading.name,
        runes: placed
          .slice()
          .sort((a, b) => a.positionIndex - b.positionIndex)
          .map((p) => {
            const r = getRune(p.runeId)!;
            const pos = reading.positions[p.positionIndex];
            return {
              runeName: r.name,
              runeLiteral: r.literal,
              positionName: pos.name,
              positionMeaning: pos.meaning,
              divinatory: r.divinatory,
            };
          }),
      },
    })
      .then((res) => {
        if (cancelled) return;
        setAiNarrative(res.narrative);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("RATE_LIMIT")) setAiError("El oráculo está siendo muy consultado. Intentá en unos segundos.");
        else if (msg.includes("CREDITS")) setAiError("Se agotaron los créditos del oráculo. Avisá al guardián del santuario.");
        else setAiError("El oráculo no pudo tejer el relato. Mostramos el hilo ancestral.");
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = placed
    .slice()
    .sort((a, b) => a.positionIndex - b.positionIndex)
    .map((p) => ({
      rune: getRune(p.runeId)!,
      position: reading.positions[p.positionIndex],
    }));

  // Aggregate keywords (deduped, capped)
  const keywords = Array.from(
    new Set(items.flatMap((i) => i.rune.keywords)),
  ).slice(0, 8);

  // Tone analysis based on rune symbolism (shadow-leaning runes)
  const shadowIds = new Set([
    "hagalaz", "nauthiz", "isa", "thurisaz", "perthro",
  ]);
  const shadowCount = items.filter((i) => shadowIds.has(i.rune.id)).length;
  const tone =
    shadowCount >= Math.ceil(items.length / 2)
      ? "Las runas traen una etapa de prueba y depuración: el camino exige paciencia, recogimiento y desapego antes de ver florecer lo nuevo."
      : shadowCount === 0
      ? "El conjunto vibra con una energía favorable: el destino sopla a tu favor y te invita a actuar con confianza y gratitud."
      : "Hay luces y sombras tejidas en este telar: la sabiduría está en honrar ambas y avanzar con conciencia plena.";

  // Tense detection per position to keep verbs coherent
  type Tense = "past" | "present" | "future";
  const tenseFor = (positionName: string): Tense => {
    if (positionName === "Pasado" || positionName.endsWith("· Pasado") || positionName.startsWith("Pasado ·")) return "past";
    if (
      positionName === "Futuro" ||
      positionName === "Cielo" ||
      positionName === "Fruto" ||
      positionName.endsWith("· Futuro") ||
      positionName.startsWith("Futuro ·")
    )
      return "future";
    return "present";
  };

  // Conjugate the verb that introduces the rune's message, respecting tense
  const verbFor = (tense: Tense): string => {
    if (tense === "past") return "te susurraba";
    if (tense === "future") return "te susurrará";
    return "te susurra";
  };

  // Warm, human openings per position
  const connectorFor = (positionName: string, idx: number, tense: Tense): string => {
    const map: Record<string, string> = {
      "Pasado": "Mirá, todo empezó hace un tiempo: en aquel rincón de tu historia",
      "Presente": "Hoy, justo en este momento que estás viviendo,",
      "Futuro": "Y más adelante, cuando el camino se vaya abriendo,",
      "Raíz": "En lo más hondo, en eso que sos y que te sostiene desde siempre,",
      "Superior": "Adentro tuyo, en eso íntimo que pocas veces mostrás,",
      "Cielo": "Y desde arriba, como un guiño de los dioses,",
      "Tronco": "Y como tronco firme de tu vida hoy,",
      "Rama Izquierda": "Por el lado de lo que recibís y de tu intuición,",
      "Rama Derecha": "Y por el lado de lo que entregás y hacés,",
      "Copa Izquierda": "Entre tus sueños y aquello que anhelás en silencio,",
      "Copa Derecha": "Y en lo que el mundo te va devolviendo,",
      "Fruto": "Al final, como cosecha de todo este recorrido,",
      "Espíritu · Pasado": "En lo alto del castillo, como herencia espiritual del ayer,",
      "Espíritu · Presente": "Hoy, la chispa divina que arde en vos",
      "Espíritu · Futuro": "Y desde el cielo, lo que los dioses preparan para vos,",
      "Mente · Pasado": "En tu mente, aquellos pensamientos que te trajeron hasta aquí,",
      "Mente · Presente": "Hoy, eso que ocupa tu cabeza y tu corazón,",
      "Mente · Futuro": "Y más adelante, hacia donde tus pensamientos te llevan,",
      "Cuerpo · Pasado": "En lo concreto, las acciones de ayer que dejaron huella,",
      "Cuerpo · Presente": "Hoy, en tu realidad de cada día,",
      "Cuerpo · Futuro": "Y como cosecha tangible que se aproxima,",
    };
    if (map[positionName]) return map[positionName];
    if (idx === 0) return "Para empezar a hilar esta historia,";
    if (idx === items.length - 1) return "Y para cerrar el círculo,";
    return "Después,";
  };

  // Build a sentence with proper verb tense agreement
  const sentenceFor = (positionName: string, runeName: string, runeLiteral: string, divinatory: string, idx: number) => {
    const tense = tenseFor(positionName);
    const connector = connectorFor(positionName, idx, tense);
    const verb = verbFor(tense);
    const aparecer = tense === "past" ? "apareció" : tense === "future" ? "aparecerá" : "aparece";
    const div = divinatory.trim().replace(/\.$/, "");
    const msg = div.charAt(0).toLowerCase() + div.slice(1);
    return `${connector} ${aparecer} **${runeName}** —${runeLiteral.toLowerCase()}—, y ${verb}: ${msg}.`;
  };

  const narrativeText = items
    .map((i, idx) => sentenceFor(i.position.name, i.rune.name, i.rune.literal, i.rune.divinatory, idx))
    .join(" ");

  const narrativeParts = narrativeText.split(/\*\*(.+?)\*\*/g);

  return (
    <section className="mt-12 rounded-xl border border-gold/40 bg-gradient-to-b from-card/60 to-card/30 p-6 md:p-10 backdrop-blur-sm rune-glow animate-fade-in">
      <div className="text-center mb-6">
        <p className="font-display text-[0.7rem] uppercase tracking-[0.4em] text-gold/80">
          Síntesis del Oráculo
        </p>
        <h2 className="mt-2 font-display text-2xl md:text-3xl text-secondary text-glow-soft">
          El mensaje de las {reading.runesRequired} runas
        </h2>
        <div className="ceremonial-divider mt-5" />
      </div>

      <div className="space-y-6">
        <p className="font-body italic text-foreground/90 leading-relaxed text-center max-w-2xl mx-auto">
          {tone}
        </p>

        {keywords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-gold/30 bg-primary/15 px-3 py-1 font-display text-[0.65rem] uppercase tracking-[0.2em] text-gold"
              >
                {k}
              </span>
            ))}
          </div>
        )}

        <div className="ceremonial-divider" />

        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase tracking-widest text-gold text-center mb-3">
            Hilo del relato
          </h3>
          {hasQuestion && aiLoading && (
            <p className="font-body italic text-center text-muted-foreground animate-pulse">
              El oráculo está tejiendo tu respuesta...
            </p>
          )}
          {hasQuestion && aiError && !aiNarrative && (
            <p className="font-body italic text-center text-destructive/80 text-sm">{aiError}</p>
          )}
          {hasQuestion && aiNarrative ? (
            <div className="font-body text-foreground/90 leading-relaxed max-w-3xl mx-auto space-y-4">
              {aiNarrative.split(/\n\n+/).map((para, j) => {
                const parts = para.split(/\*\*(.+?)\*\*/g);
                return (
                  <p key={j} className="text-justify">
                    {parts.map((part, k) =>
                      k % 2 === 1 ? (
                        <span key={k} className="font-display text-secondary">{part}</span>
                      ) : (
                        <span key={k}>{part}</span>
                      ),
                    )}
                  </p>
                );
              })}
            </div>
          ) : (!hasQuestion || (aiError && !aiLoading)) ? (
            <p className="font-body text-foreground/90 leading-relaxed text-justify max-w-3xl mx-auto">
              {narrativeParts.map((part, j) =>
                j % 2 === 1 ? (
                  <span key={j} className="font-display text-secondary">
                    {part}
                  </span>
                ) : (
                  <span key={j}>{part}</span>
                ),
              )}
            </p>
          ) : null}
        </div>


        <div className="ceremonial-divider" />

        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-gold text-center mb-4">
            Voces de las runas
          </h3>
          <div className="space-y-4 max-w-2xl mx-auto">
            {items.map((i, idx) => (
              <blockquote
                key={idx}
                className="border-l-2 border-gold/50 pl-4 font-body italic text-secondary/90"
              >
                <span className="font-display text-gold not-italic mr-2">
                  {i.rune.glyph}
                </span>
                "{i.rune.message}"
                <footer className="mt-1 text-[0.65rem] not-italic uppercase tracking-widest text-muted-foreground">
                  — {i.rune.name} en {i.position.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

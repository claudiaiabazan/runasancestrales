import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getReading, type ReadingPosition } from "@/data/readings";
import { RUNES, getRune, type Rune } from "@/data/runes";
import { RuneStone } from "@/components/RuneStone";
import { FlippableRune } from "@/components/FlippableRune";
import { saveReading } from "@/lib/storage";
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
  const [deck, setDeck] = useState<string[]>(() => shuffleDeck());
  const [placed, setPlaced] = useState<PlacedRune[]>([]);
  const [revealedCount, setRevealedCount] = useState(0); // how many are flipped face-up
  const [activeRuneId, setActiveRuneId] = useState<string | null>(null);

  const allPlaced = placed.length === reading.runesRequired;
  const allRevealed = revealedCount === reading.runesRequired;

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

  function reset() {
    setDeck(shuffleDeck());
    setPlaced([]);
    setRevealedCount(0);
    setActiveRuneId(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
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

      {/* Deck */}
      {!allPlaced && (
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
}: {
  reading: ReturnType<typeof getReading> extends infer T ? Exclude<T, undefined> : never;
  placed: PlacedRune[];
}) {
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
      "Pasado · Espíritu": "En lo alto del castillo del ayer, como herencia espiritual recibida,",
      "Pasado · Mente": "En tu mente, aquellos pensamientos que te trajeron hasta aquí,",
      "Pasado · Cuerpo": "En lo concreto, las acciones de ayer que dejaron huella,",
      "Presente · Espíritu": "Hoy, la chispa divina que arde en vos",
      "Presente · Mente": "Hoy, eso que ocupa tu cabeza y tu corazón,",
      "Presente · Cuerpo": "Hoy, en tu realidad de cada día,",
      "Futuro · Espíritu": "Y desde el cielo, lo que los dioses preparan para vos,",
      "Futuro · Mente": "Y más adelante, hacia donde tus pensamientos te llevan,",
      "Futuro · Cuerpo": "Y como cosecha tangible que se aproxima,",
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

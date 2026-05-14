import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RUNES, type Rune } from "@/data/runes";
import { RuneStone } from "@/components/RuneStone";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runas")({
  head: () => ({
    meta: [
      { title: "Las 24 Runas del Futhark Antiguo · Conocer las runas" },
      { name: "description", content: "Catálogo completo de las 24 runas del Futhark Antiguo: significado, fonética, interpretación y mensaje espiritual." },
    ],
  }),
  component: RunesGrid,
});

const AETT_NAMES: Record<number, string> = {
  1: "Primer Aett · Freyr",
  2: "Segundo Aett · Heimdall",
  3: "Tercer Aett · Tyr",
};

function RunesGrid() {
  const [selected, setSelected] = useState<Rune | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="text-center">
        <p className="font-display text-xs tracking-[0.4em] uppercase text-gold/80">El Futhark Antiguo</p>
        <h1 className="mt-3 font-display text-4xl text-secondary md:text-5xl">Las 24 runas sagradas</h1>
        <p className="mt-4 mx-auto max-w-2xl font-body italic text-muted-foreground">
          Cada runa es una ventana a un universo de secretos. Tres familias —aettir— de ocho runas cada una,
          dedicadas a Freyr, Heimdall y Tyr.
        </p>
        <div className="ceremonial-divider mx-auto mt-6 w-40" />
      </div>

      {[1, 2, 3].map((aett) => (
        <section key={aett} className="mt-12">
          <h2 className="mb-6 font-display text-sm uppercase tracking-[0.3em] text-gold">
            {AETT_NAMES[aett]}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {RUNES.filter((r) => r.aett === aett).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="group flex flex-col items-center gap-2 rounded-lg border border-gold/15 bg-card/30 p-3 transition-all hover:-translate-y-1 hover:border-gold/50 hover:bg-card/60 hover:rune-glow"
              >
                <span className="font-display text-4xl text-gold transition group-hover:text-glow">
                  {r.glyph}
                </span>
                <span className="font-display text-xs uppercase tracking-widest text-secondary">
                  {r.name}
                </span>
                <span className="text-[0.65rem] text-muted-foreground">/{r.phonetic}/</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {selected && <RuneModal rune={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function RuneModal({ rune, onClose }: { rune: Rune; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md",
        "bg-background/80 animate-fade-in",
      )}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gold/40 bg-card p-8 rune-glow"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-gold text-2xl leading-none"
        >
          ×
        </button>
        <div className="flex flex-col items-center text-center">
          <RuneStone glyph={rune.glyph} size="lg" glowing />
          <h2 className="mt-5 font-display text-3xl tracking-wider text-secondary">{rune.name}</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
            Fonética /{rune.phonetic}/ · {rune.literal}
          </p>
        </div>

        <div className="ceremonial-divider mt-6" />

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-display text-xs uppercase tracking-widest text-gold mb-2">Significado</h3>
            <ul className="space-y-2">
              {rune.meanings.map((m, i) => (
                <li key={i} className="text-sm text-foreground/85 leading-relaxed">{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs uppercase tracking-widest text-gold mb-1">En la lectura oracular</h3>
            <p className="text-sm text-foreground/85">{rune.divinatory}</p>
          </div>
          <div>
            <h3 className="font-display text-xs uppercase tracking-widest text-gold mb-1">Ritual y magia</h3>
            <p className="text-sm text-foreground/85">{rune.ritual}</p>
          </div>
          <div>
            <h3 className="font-display text-xs uppercase tracking-widest text-gold mb-1">Vida cotidiana</h3>
            <p className="text-sm text-foreground/85">{rune.daily}</p>
          </div>
          <blockquote className="border-l-2 border-gold/60 pl-4 font-body text-base italic text-secondary/90">
            “{rune.message}”
          </blockquote>
        </div>
      </div>
    </div>
  );
}

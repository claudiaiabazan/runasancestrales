import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getHistory, clearHistory, type SavedReading } from "@/lib/storage";
import { getRune } from "@/data/runes";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de Consultas · Runas Ancestrales" },
      { name: "description", content: "Tus consultas pasadas al oráculo de las runas." },
    ],
  }),
  component: History,
});

function History() {
  const [items, setItems] = useState<SavedReading[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getHistory());
    setHydrated(true);
  }, []);

  function reset() {
    if (confirm("¿Borrar todo el historial de consultas?")) {
      clearHistory();
      setItems([]);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="text-center">
        <p className="font-display text-xs tracking-[0.4em] uppercase text-gold/80">Memoria del oráculo</p>
        <h1 className="mt-3 font-display text-4xl text-secondary md:text-5xl">Historial de consultas</h1>
        <div className="ceremonial-divider mx-auto mt-6 w-40" />
      </div>

      {hydrated && items.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground italic">Aún no has consultado al oráculo.</p>
          <Link
            to="/oraculo"
            className="mt-6 inline-flex items-center justify-center rounded-md border border-gold/40 bg-primary/20 px-6 py-2.5 font-display text-xs uppercase tracking-widest text-gold hover:bg-primary/40"
          >
            Realizar mi primera lectura
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-8 space-y-4">
            {items.map((it) => (
              <article
                key={it.id}
                className="rounded-lg border border-gold/20 bg-card/40 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg tracking-wider text-secondary">{it.readingName}</h2>
                  <time className="text-xs text-muted-foreground">
                    {new Date(it.date).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {it.runes.map((r, i) => {
                    const rune = getRune(r.runeId);
                    if (!rune) return null;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border border-gold/15 bg-background/40 px-3 py-2"
                      >
                        <span className="font-display text-2xl text-gold">{rune.glyph}</span>
                        <div>
                          <p className="font-display text-xs uppercase tracking-widest text-secondary">
                            {rune.name}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                            {r.positionName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={reset}
              className="rounded-md border border-destructive/40 px-5 py-2 font-display text-xs uppercase tracking-widest text-destructive/80 hover:bg-destructive/20"
            >
              Borrar historial
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { READINGS } from "@/data/readings";

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
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
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
          <li>Elige la tirada que resuene con tu pregunta.</li>
          <li>Toca las runas que esperan en silencio. Cada una bajará al lugar designado.</li>
          <li>Cuando todas hayan sido elegidas, se voltearán una a una.</li>
          <li>Toca cada runa colocada para escuchar su mensaje según su posición.</li>
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

      <div className="ceremonial-divider mx-auto mt-20 w-40" />

      <div className="mt-12 mx-auto max-w-3xl">
        <h2 className="font-display text-2xl text-gold">Cómo consultar al oráculo</h2>
        <ol className="mt-6 list-decimal list-inside space-y-3 marker:text-gold/70 font-body text-lg leading-relaxed text-foreground/85">
          <li>Elige la tirada que resuene con tu pregunta.</li>
          <li>Toca las runas que esperan en silencio. Cada una bajará al lugar designado.</li>
          <li>Cuando todas hayan sido elegidas, se voltearán una a una.</li>
          <li>Toca cada runa colocada para escuchar su mensaje según su posición.</li>
        </ol>
      </div>
    </div>
  );
}

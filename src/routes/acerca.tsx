import { createFileRoute, Link } from "@tanstack/react-router";
import vegvisir from "@/assets/vegvisir.png";

export const Route = createFileRoute("/acerca")({
  head: () => ({
    meta: [
      { title: "Acerca del Oráculo · Runas Ancestrales" },
      { name: "description", content: "El origen del oráculo, las runas del Futhark Antiguo y el libro El Camino de las Runas de Sigrid Larsen." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="text-center">
        <img
          src={vegvisir}
          alt="Vegvísir"
          width={120}
          height={120}
          loading="lazy"
          className="mx-auto w-24 opacity-90 animate-spin-slow"
        />
        <p className="mt-6 font-display text-xs tracking-[0.4em] uppercase text-gold/80">El Oráculo</p>
        <h1 className="mt-3 font-display text-4xl text-secondary md:text-5xl">Acerca del camino</h1>
        <div className="ceremonial-divider mx-auto mt-6 w-40" />
      </div>

      <div className="mt-10 space-y-6 font-body text-lg leading-relaxed text-foreground/85">
        <p>
          Las runas del <em>Futhark Antiguo</em> representan uno de los sistemas de escritura más antiguos y
          enigmáticos de la historia, utilizados por los pueblos germánicos y escandinavos desde aproximadamente
          el siglo II d.C. Su nombre, <em>runa</em>, significa “secreto” o “misterio”.
        </p>
        <p>
          La leyenda dice que fue el mismísimo Odín quien descubrió el secreto de las runas, colgándose del
          árbol del mundo, <em>Yggdrasil</em>, durante nueve días y nueve noches hasta que los símbolos se le
          revelaron.
        </p>
        <p>
          Esta aplicación es una invitación a conectar con esa sabiduría ancestral. Las interpretaciones,
          mensajes y métodos de lectura provienen del libro{" "}
          <strong className="text-secondary">El Camino de las Runas</strong> de{" "}
          <strong className="text-secondary">Sigrid Larsen</strong>.
        </p>
        <p>
          Cada tirada es un ritual: aquieta tu mente, formula tu pregunta y deja que las piedras te respondan.
          Las runas no predicen un destino fijo, sino que iluminan el sendero que tu alma ya recorre.
        </p>

        <div className="ceremonial-divider my-8" />

        <h2 className="font-display text-2xl text-gold">Cómo consultar al oráculo</h2>
        <ol className="list-decimal list-inside space-y-3 marker:text-gold/70">
          <li>Elige la tirada que resuene con tu pregunta.</li>
          <li>Toca las runas que esperan en silencio. Cada una bajará al lugar designado.</li>
          <li>Cuando todas hayan sido elegidas, se voltearán una a una.</li>
          <li>Toca cada runa colocada para escuchar su mensaje según su posición.</li>
        </ol>

        <div className="mt-10 text-center">
          <Link
            to="/oraculo"
            className="inline-flex items-center justify-center rounded-md border border-gold/60 bg-primary/30 px-8 py-3.5 font-display text-sm uppercase tracking-[0.25em] text-secondary hover:bg-primary/50 rune-glow"
          >
            Comenzar mi consulta
          </Link>
        </div>
      </div>
    </div>
  );
}

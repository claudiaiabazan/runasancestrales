import { createFileRoute, Link } from "@tanstack/react-router";
import heroForest from "@/assets/hero-forest.jpg";
import vegvisir from "@/assets/vegvisir.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lectura de Runas · Oráculo Nórdico Interactivo" },
      { name: "description", content: "Las piedras mágicas, mensajeras de los dioses. Consulta a las runas ancestrales del Futhark Antiguo en una experiencia inmersiva y ceremonial." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroForest}
            alt="Bosque nórdico con runas brillando entre la niebla"
            width={1536}
            height={1024}
            className="h-full w-full object-cover opacity-50"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.16 0.012 260 / 0.7) 0%, oklch(0.16 0.012 260 / 0.55) 40%, oklch(0.16 0.012 260) 95%)",
            }}
          />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 pt-24 pb-32 text-center md:pt-32 md:pb-40">
          <img
            src={vegvisir}
            alt="Vegvísir, el compás nórdico"
            width={220}
            height={220}
            className="mb-10 w-40 animate-spin-slow opacity-90 md:w-52 animate-pulse-glow"
          />

          <p className="mb-4 font-display text-xs tracking-[0.5em] uppercase text-gold animate-fade-in-slow">
            ᚠ Mensajeras de los dioses ᚦ
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight text-secondary text-glow md:text-7xl animate-fade-in">
            Lectura de Runas
          </h1>
          <p className="mt-6 max-w-2xl font-body text-xl italic text-foreground/80 md:text-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Las piedras mágicas, mensajeras de los dioses, esperan en silencio bajo el árbol del mundo.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/oraculo"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-md border border-gold/60 bg-primary/30 px-8 py-3.5 font-display text-sm uppercase tracking-[0.25em] text-secondary transition-all hover:bg-primary/50 hover:text-glow rune-glow"
            >
              <span className="relative z-10">Comenzar lectura</span>
            </Link>
            <Link
              to="/runas"
              className="inline-flex items-center justify-center rounded-md border border-gold/30 px-8 py-3.5 font-display text-sm uppercase tracking-[0.25em] text-foreground/85 transition hover:border-gold/60 hover:text-gold"
            >
              Conocer las runas
            </Link>
            <Link
              to="/acerca"
              className="inline-flex items-center justify-center rounded-md px-6 py-3.5 font-display text-sm uppercase tracking-[0.25em] text-muted-foreground transition hover:text-gold"
            >
              Acerca del Oráculo
            </Link>
          </div>
        </div>
      </section>

      {/* Three readings preview */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="font-display text-xs tracking-[0.4em] uppercase text-gold/80">Las tiradas del oráculo</p>
          <h2 className="mt-3 font-display text-3xl text-secondary md:text-4xl">Cuatro caminos de consulta</h2>
          <div className="ceremonial-divider mx-auto mt-6 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Tres Nornas", desc: "Pasado · Presente · Futuro", glyph: "ᚱ" },
            { name: "Cruz Celta", desc: "Análisis profundo de una situación", glyph: "ᛏ" },
            { name: "Árbol de la Vida", desc: "Crecimiento espiritual y propósito", glyph: "ᛇ" },
            { name: "Pareja", desc: "Conexión entre dos almas", glyph: "ᚷ" },
          ].map((r) => (
            <div
              key={r.name}
              className="group rounded-lg border border-gold/20 bg-card/40 p-6 backdrop-blur-sm transition-all hover:border-gold/50 hover:bg-card/60"
            >
              <div className="mb-4 font-display text-5xl text-gold transition-all group-hover:text-glow">
                {r.glyph}
              </div>
              <h3 className="font-display text-lg tracking-wider text-secondary">{r.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

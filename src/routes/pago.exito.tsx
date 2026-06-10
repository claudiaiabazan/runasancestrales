import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pago/exito")({
  head: () => ({
    meta: [{ title: "Pago aprobado · Oráculo de Runas" }],
  }),
  component: PagoExito,
});

function PagoExito() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-6xl text-gold text-glow">ᛟ</p>
      <h1 className="mt-4 font-display text-2xl tracking-[0.2em] uppercase text-secondary">
        Pago recibido
      </h1>
      <p className="mt-4 font-body italic text-muted-foreground">
        Gracias. En instantes vas a ver tu lectura desbloqueada. Si no aparece, refrescá la página.
      </p>
      <Link
        to="/oraculo"
        className="mt-8 inline-block rounded-md border border-gold/40 bg-primary/20 px-6 py-3 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/40"
      >
        Elegir tirada
      </Link>
    </div>
  );
}

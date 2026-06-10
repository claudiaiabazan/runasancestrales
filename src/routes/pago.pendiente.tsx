import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pago/pendiente")({
  head: () => ({
    meta: [{ title: "Pago pendiente · Oráculo de Runas" }],
  }),
  component: PagoPendiente,
});

function PagoPendiente() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-6xl text-gold text-glow">ᛇ</p>
      <h1 className="mt-4 font-display text-2xl tracking-[0.2em] uppercase text-secondary">
        Pago en proceso
      </h1>
      <p className="mt-4 font-body italic text-muted-foreground">
        Tu pago todavía no fue confirmado por Mercado Pago. Cuando se acredite vas a poder hacer tu lectura.
      </p>
      <Link
        to="/oraculo"
        className="mt-8 inline-block rounded-md border border-gold/40 bg-primary/20 px-6 py-3 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/40"
      >
        Volver al oráculo
      </Link>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pago/error")({
  head: () => ({
    meta: [{ title: "Pago rechazado · Oráculo de Runas" }],
  }),
  component: PagoError,
});

function PagoError() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-6xl text-destructive text-glow">ᛉ</p>
      <h1 className="mt-4 font-display text-2xl tracking-[0.2em] uppercase text-secondary">
        Pago no completado
      </h1>
      <p className="mt-4 font-body italic text-muted-foreground">
        Las runas no recibieron tu ofrenda. Podés intentar nuevamente cuando quieras.
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

import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="relative z-20 border-b border-gold/30 backdrop-blur-sm bg-background/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 gap-4">
        <Link to="/" className="group flex items-center gap-3">
          <span className="text-2xl text-gold transition-all group-hover:text-glow">ᚱ</span>
          <span className="font-display text-sm tracking-[0.3em] uppercase text-secondary">
            El Camino<span className="text-gold"> · </span>de las Runas
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-display tracking-widest uppercase">
          <NavLink to="/oraculo">Oráculo</NavLink>
          <NavLink to="/runas">Runas</NavLink>
          <NavLink to="/historial">Historial</NavLink>
          <NavLink to="/acerca">Acerca</NavLink>
          {!loading && (
            user ? (
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="ml-2 rounded-md border border-gold/30 px-3 py-2 text-xs text-muted-foreground hover:text-gold hover:border-gold/60"
                title={user.email ?? ""}
              >
                Salir
              </button>
            ) : (
              <Link
                to="/auth"
                className="ml-2 rounded-md border border-gold/40 bg-primary/20 px-3 py-2 text-xs text-gold hover:bg-primary/40"
              >
                Ingresar
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-gold"
      activeProps={{ className: "rounded-md px-3 py-2 text-xs text-gold text-glow-soft" }}
    >
      {children}
    </Link>
  );
}

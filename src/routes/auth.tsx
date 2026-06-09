import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso al Oráculo · Runas Ancestrales" },
      { name: "description", content: "Ingresá o registrate para consultar las runas." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/oraculo" });
  }, [user, loading, navigate]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="text-center mb-8">
        <p className="font-display text-5xl text-gold text-glow">ᚱ</p>
        <h1 className="mt-4 font-display text-2xl tracking-[0.25em] uppercase text-secondary">
          {mode === "signin" ? "Ingresar al Oráculo" : "Unirse al Sendero"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground italic">
          {mode === "signin"
            ? "Cruzá el umbral para consultar a las runas."
            : "Las primeras 2 lecturas del mes son gratis."}
        </p>
      </div>

      <div className="rounded-xl border border-gold/30 bg-card/40 backdrop-blur-sm p-6 space-y-5">
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full rounded-md border border-gold/40 bg-background/40 px-4 py-2.5 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/30 disabled:opacity-50"
        >
          Continuar con Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gold/20" />
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">o con email</span>
          <div className="h-px flex-1 bg-gold/20" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[0.65rem] uppercase tracking-widest text-gold/80 mb-1">Nombre</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Cómo te llamamos"
                className="w-full rounded-md border border-gold/30 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-gold/70"
              />
            </div>
          )}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-gold/80 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gold/30 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-gold/70"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-widest text-gold/80 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gold/30 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-gold/70"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive italic">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md border border-gold/50 bg-primary/30 px-4 py-2.5 font-display text-xs uppercase tracking-[0.25em] text-gold hover:bg-primary/50 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "signin" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-gold hover:underline"
          >
            {mode === "signin" ? "Registrate" : "Ingresá"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-gold">← Volver al inicio</Link>
      </p>
    </div>
  );
}

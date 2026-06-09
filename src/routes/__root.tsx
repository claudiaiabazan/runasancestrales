import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";

function NotFoundComponent() {
  return (
    <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-7xl text-gold text-glow">ᛪ</p>
        <h1 className="mt-4 font-display text-2xl tracking-widest uppercase">Sendero perdido</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Las runas no reconocen este camino. Regresa al claro del bosque.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-md border border-gold/40 bg-primary/20 px-5 py-2.5 font-display text-sm uppercase tracking-widest text-gold transition hover:bg-primary/30"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl tracking-widest uppercase text-gold">El velo se ha roto</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md border border-gold/40 px-5 py-2.5 font-display text-sm uppercase tracking-widest text-gold hover:bg-primary/20"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Runas Ancestrales · Oráculo del Futhark Antiguo" },
      { name: "description", content: "Lectura interactiva de runas del Futhark Antiguo basada en el libro El Camino de las Runas. Tres Nornas, Cruz Celta, Árbol de la Vida y Pareja." },
      { name: "author", content: "Runas Ancestrales" },
      { property: "og:title", content: "Runas Ancestrales · Oráculo del Futhark Antiguo" },
      { property: "og:description", content: "Un oráculo nórdico interactivo para consultar a las runas ancestrales." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Atmosphere />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="relative z-10 border-t border-gold/20 py-6 text-center text-xs text-muted-foreground">
          <p className="font-display tracking-[0.3em] uppercase">
            ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ
          </p>
          <p className="mt-2">Basado en el libro · El Camino de las Runas · Sigrid Larsen</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

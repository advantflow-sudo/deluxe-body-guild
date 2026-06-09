import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CommandPalette } from "@/components/deluxe/CommandPalette";
import { MarketingChatBot } from "@/components/deluxe/MarketingChatBot";
import { CookieConsent } from "@/components/deluxe/CookieConsent";
import { InstallPrompt } from "@/components/deluxe/InstallPrompt";
import { ReduceMotionProvider } from "@/hooks/useReduceMotion";
import { CursorSpotlight } from "@/components/deluxe/CursorSpotlight";
import { ScrollProgress } from "@/components/deluxe/ScrollProgress";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Deluxe Fitness — Premium transformation app" },
      { name: "description", content: "Deluxe Fitness is a premium lifestyle app for transformation, community, and elevated living." },
      { name: "author", content: "Deluxe Fitness" },
      { property: "og:site_name", content: "Deluxe Fitness" },
      { property: "og:title", content: "Deluxe Fitness — Premium transformation app" },
      { property: "og:description", content: "Deluxe Fitness is a premium lifestyle app for transformation, community, and elevated living." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Deluxe Fitness — Premium transformation app" },
      { name: "twitter:description", content: "Deluxe Fitness is a premium lifestyle app for transformation, community, and elevated living." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/92c5b0c7-80c8-4a85-8f9b-bdd3fb8bd7b2/id-preview-500a573a--eba2b5b6-0e26-42b9-b5c5-a2b72735fe8e.lovable.app-1779372939990.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/92c5b0c7-80c8-4a85-8f9b-bdd3fb8bd7b2/id-preview-500a573a--eba2b5b6-0e26-42b9-b5c5-a2b72735fe8e.lovable.app-1779372939990.png" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Deluxe" },
      { name: "theme-color", content: "#0a0a0a" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/app-icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Deluxe Fitness",
          url: "https://deluxefitness.app",
          description: "Premium transformation, community, and elevated living app.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Deluxe Fitness",
          url: "https://deluxefitness.app",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ReduceMotionProvider>
        <AuthProvider>
          <ScrollProgress />
          <CursorSpotlight />
          <Outlet />
          <CommandPalette />
          <MarketingChatBot />
          <CookieConsent />
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </ReduceMotionProvider>
    </QueryClientProvider>
  );
}

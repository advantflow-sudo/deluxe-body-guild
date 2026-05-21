import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/deluxe/Logo";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Deluxe Fitness" },
      { name: "description", content: "Sign in to your Deluxe Fitness member account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/app" });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("Welcome to Deluxe Fitness.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? `${provider} sign-in failed`);
        setBusy(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${provider} sign-in failed`);
      setBusy(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Enter your email to receive a magic link.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/app" },
      });
      if (error) throw error;
      toast.success("Magic link sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-deluxe-black px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link to="/" className="mb-10">
          <Logo />
        </Link>
        <div className="w-full border border-gold/20 bg-deluxe-forest/30 p-8 backdrop-blur-sm">
          <SectionLabel>{mode === "login" ? "Member Sign In" : "Join Deluxe"}</SectionLabel>
          <h1 className="mt-3 font-display text-3xl text-foreground">
            {mode === "login" ? "Welcome back." : "Begin your transformation."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to access your dashboard, programs, and community."
              : "Create your account and unlock the Deluxe Fitness lifestyle."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="group flex items-center justify-center gap-2 border border-gold/30 bg-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold hover:bg-gold/10 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.2 0-5.85-2.7-5.85-6s2.65-6 5.85-6c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.95 3.85 14.7 3 12 3 6.85 3 2.7 7.15 2.7 12.3S6.85 21.6 12 21.6c6.95 0 9.3-4.85 9.3-7.4 0-.5-.05-.85-.1-1.1z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={busy}
              className="group flex items-center justify-center gap-2 border border-gold/30 bg-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold hover:bg-gold/10 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden fill="currentColor">
                <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.06-.78.86-2.06 1.53-3.12 1.45-.13-1.1.42-2.27 1.13-3.04.79-.86 2.13-1.49 3.17-1.47zM20.5 17.5c-.55 1.26-.81 1.82-1.52 2.93-.99 1.55-2.38 3.48-4.1 3.49-1.53.02-1.92-1-3.99-.99-2.07.01-2.5 1.01-4.03.99-1.72-.02-3.04-1.76-4.03-3.31C.04 16.97-.27 11.86 1.7 9.15c1.4-1.92 3.6-3.05 5.68-3.05 2.11 0 3.44 1.16 5.19 1.16 1.69 0 2.72-1.16 5.16-1.16 1.84 0 3.8.99 5.19 2.71-4.57 2.5-3.82 9.04-2.42 8.69z"/>
              </svg>
              Apple
            </button>
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-gold/30 bg-gold/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/15 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
            </svg>
            Email me a magic link
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-px flex-1 bg-gold/15" /> or password <span className="h-px flex-1 bg-gold/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 w-full border border-gold/20 bg-deluxe-black px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border border-gold/20 bg-deluxe-black px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-gold/20 bg-deluxe-black px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <GoldButton type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </GoldButton>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-gold"
          >
            {mode === "login"
              ? "New here? Create an account →"
              : "Already a member? Sign in →"}
          </button>
        </div>

        <Link
          to="/"
          className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

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

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden border border-gold/40 bg-gradient-to-b from-deluxe-black to-deluxe-forest/40 px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-8px_rgba(201,168,76,0.55)] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.8.5 6.9 5.8 3.1 13.5l7.8 6c1.8-5.4 6.9-9.5 13.1-9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z"/>
                <path fill="#FBBC05" d="M10.9 28.5c-.5-1.4-.7-2.9-.7-4.5s.2-3.1.7-4.5l-7.8-6C1.2 16.8 0 20.3 0 24s1.2 7.2 3.1 10.5l7.8-6z"/>
                <path fill="#34A853" d="M24 47.5c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.6 2.3-6.2 0-11.3-4.1-13.1-9.5l-7.8 6C6.9 42.2 14.8 47.5 24 47.5z"/>
              </svg>
              <span>Continue with Gmail</span>
            </button>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 border border-gold/30 bg-gold/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/15 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
              </svg>
              Email me a sign-in link
            </button>
          </div>

          <div className="mt-4 rounded-sm border border-gold/15 bg-gold/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">How Gmail sign-in works</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              You'll be redirected to Google to verify your identity, then returned to Deluxe Fitness. We only receive your name and email — never your Google password.
            </p>
          </div>


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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/deluxe/Header";
import { Footer } from "@/components/deluxe/Footer";
import { SectionLabel } from "@/components/deluxe/ui";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Deluxe Coach — AI Fitness & Lifestyle Assistant" },
      {
        name: "description",
        content:
          "Your private AI coach for training, nutrition, recovery, and mindset. Crafted for the Deluxe Fitness lifestyle.",
      },
      { property: "og:title", content: "Deluxe Coach — AI Fitness & Lifestyle Assistant" },
      {
        property: "og:description",
        content:
          "Private AI coach for training, nutrition, recovery, and mindset — built for Deluxe Fitness members.",
      },
      { property: "og:url", content: "https://deluxefitness.app/coach" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/coach" }],
  }),
  component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Build me a 4-day strength split",
  "What should I eat to lean down without losing muscle?",
  "How do I fix tight hips from sitting?",
  "Design a morning routine for discipline",
];

function CoachPage() {
  const { session } = useAuth();
  const { isPremium, loading: premLoading } = usePremium();
  const locked = !!session && !premLoading && !isPremium;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    if (locked) {
      toast.error("Upgrade to Premium to chat with the Coach.");
      return;
    }
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 429) toast.error("Too many requests. Slow down a moment.");
        else if (res.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Coach is unavailable right now.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const pushDelta = (delta: string) => {
        assistant += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistant };
          return copy;
        });
      };

      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) pushDelta(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection lost. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-deluxe-black">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10">
        <div className="text-center">
          <SectionLabel>Deluxe Coach</SectionLabel>
          <h1 className="mt-3 font-display text-3xl text-foreground md:text-5xl">
            Your private <span className="text-gold-gradient italic font-serif">AI coach</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Training, nutrition, recovery, mindset — disciplined answers, on demand.
          </p>
        </div>

        {locked && (
          <div className="mt-6 flex flex-col items-center gap-3 border border-gold/30 bg-gold-gradient/10 p-5 text-center sm:flex-row sm:text-left">
            <Crown className="h-6 w-6 shrink-0 text-gold" />
            <div className="flex-1">
              <div className="font-display text-lg text-foreground">Coach is a Premium feature</div>
              <p className="text-xs text-muted-foreground">Upgrade to unlock unlimited AI coaching, nutrition plans, and more.</p>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-2 bg-gold-gradient px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-deluxe-black">
              <Lock className="h-3 w-3" /> Upgrade
            </Link>
          </div>
        )}


        <div
          ref={scrollRef}
          className="mt-8 flex-1 space-y-5 overflow-y-auto border border-gold/15 bg-deluxe-forest/20 p-5 md:p-8"
          style={{ minHeight: 380, maxHeight: "60vh" }}
        >
          {messages.length === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="group border border-gold/20 bg-deluxe-black/40 p-4 text-left text-sm text-muted-foreground transition hover:border-gold/60 hover:text-foreground"
                >
                  <Sparkles className="mb-2 h-4 w-4 text-gold" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/40 bg-deluxe-black">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold-gradient font-medium text-deluxe-black"
                    : "border border-gold/15 bg-deluxe-black/60 text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose-deluxe">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
                    </span>
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/40 bg-deluxe-black">
                  <User className="h-3.5 w-3.5 text-gold" />
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-5 flex items-center gap-3 border border-gold/20 bg-deluxe-black/60 p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the coach anything…"
            className="flex-1 bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 bg-gold-gradient px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-deluxe-black transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </form>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Coach guidance is informational. For medical concerns, consult a qualified professional.
        </p>
      </main>
      <Footer />
    </div>
  );
}

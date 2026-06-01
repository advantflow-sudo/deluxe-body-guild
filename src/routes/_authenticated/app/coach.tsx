import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/coach")({
  component: CoachTab,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Build me a 4-day strength split",
  "Best foods to lean down without losing muscle?",
  "Fix tight hips from sitting all day",
  "Design a disciplined morning routine",
];

function CoachTab() {
  const { isPremium, loading: premLoading } = usePremium();
  const locked = !premLoading && !isPremium;
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
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

      const push = (delta: string) => {
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
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content as string | undefined;
            if (c) push(c);
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
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-2xl flex-col px-4 pt-6 sm:px-5">
      <div>
        <SectionLabel>Deluxe Coach</SectionLabel>
        <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
          Your private <span className="text-gold-gradient italic">AI coach</span>
        </h1>
      </div>

      {locked && (
        <div className="mt-4 flex items-center gap-3 border border-gold/30 bg-gold-gradient/10 p-4">
          <Crown className="h-5 w-5 shrink-0 text-gold" />
          <div className="flex-1 text-xs text-muted-foreground">
            <span className="block font-display text-sm text-foreground">Premium feature</span>
            Unlock unlimited coaching, nutrition plans & more.
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-1 bg-gold-gradient px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black">
            <Lock className="h-3 w-3" /> Upgrade
          </Link>
        </div>
      )}

      <div
        ref={scrollRef}
        className="mt-5 flex-1 space-y-4 overflow-y-auto border border-gold/15 bg-deluxe-forest/20 p-4"
        style={{ minHeight: 320, maxHeight: "55vh" }}
      >
        {messages.length === 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={locked}
                className="group border border-gold/20 bg-deluxe-black/40 p-3 text-left text-xs text-muted-foreground transition hover:border-gold/60 hover:text-foreground disabled:opacity-50"
              >
                <Sparkles className="mb-1.5 h-3.5 w-3.5 text-gold" />
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/40 bg-deluxe-black">
                <Sparkles className="h-3 w-3 text-gold" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/40 bg-deluxe-black">
                <User className="h-3 w-3 text-gold" />
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex items-center gap-2 border border-gold/20 bg-deluxe-black/60 p-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={locked ? "Upgrade to chat…" : "Ask the coach anything…"}
          className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={loading || locked}
        />
        <button
          type="submit"
          disabled={loading || locked || !input.trim()}
          className="inline-flex items-center gap-1.5 bg-gold-gradient px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black transition disabled:opacity-50"
        >
          <Send className="h-3 w-3" /> Send
        </button>
      </form>
      <p className="mt-2 pb-4 text-center text-[10px] text-muted-foreground">
        Informational only. Consult a professional for medical concerns.
      </p>
    </div>
  );
}

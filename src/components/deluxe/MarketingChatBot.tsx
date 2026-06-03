import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "df_marketing_chat_open";

export function MarketingChatBot() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm the Deluxe Fitness concierge. Ask me anything about the app: workouts, the AI coach, pricing, or how to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAppArea =
    pathname.startsWith("/app") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved === "1") setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (isAppArea) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const resp = await fetch("/api/public/marketing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const errText =
          resp.status === 429
            ? "I'm getting a lot of questions right now. Try again in a moment."
            : resp.status === 402
              ? "Service temporarily unavailable. Please reach us at /contact."
              : "Something went wrong. Try again.";
        setMessages((m) => [...m, { role: "assistant", content: errText }]);
        setLoading(false);
        return;
      }

      // SSE stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const pushDelta = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
          return copy;
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) pushDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat with Deluxe Fitness concierge"
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-deluxe-black/95 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl transition hover:bg-gold hover:text-deluxe-black sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="h-4 w-4" />
          Ask the Concierge
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Deluxe Fitness concierge chat"
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/30 bg-deluxe-black/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:bottom-6 sm:right-6"
          style={{ height: "min(560px, calc(100vh - 2rem))" }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-gold/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-gold/30 bg-gold/5">
                <Sparkles className="h-4 w-4 text-gold" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
                  Concierge
                </div>
                <div className="text-xs text-foreground/70">Ask about Deluxe Fitness</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/50 transition hover:bg-gold/10 hover:text-gold"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gold text-deluxe-black"
                      : "border border-gold/20 bg-deluxe-forest/30 text-foreground"
                  }`}
                >
                  {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gold/20 bg-deluxe-forest/30 px-3 py-2 text-sm text-foreground/60">
                  …
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-gold/20 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about workouts, pricing…"
              disabled={loading}
              className="flex-1 rounded-lg border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-deluxe-black transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User, Crown, Lock, RotateCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { rememberFromChat } from "@/lib/coach-memory.functions";
import { CoachMemoryPanel } from "@/components/deluxe/CoachMemoryPanel";
import { AdaptiveWeekCard } from "@/components/deluxe/AdaptiveWeekCard";
import { CoachConversations } from "@/components/deluxe/CoachConversations";
import { COACH_FAILURE_COPY, useCoachChat } from "@/hooks/useCoachChat";

export const Route = createFileRoute("/_authenticated/app/coach")({
  head: () => ({
    meta: [
      { title: "Coach Chat | Deluxe Fitness" },
      { name: "description", content: "Ask your Deluxe coach about training, nutrition and recovery with full context of your data." },
      { property: "og:title", content: "Coach Chat | Deluxe Fitness" },
      { property: "og:description", content: "Ask your Deluxe coach about training, nutrition and recovery with full context of your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachTab,
});

const SUGGESTIONS = [
  "Build me a 4-day strength split",
  "Best foods to lean down without losing muscle?",
  "Fix tight hips from sitting all day",
  "Design a disciplined morning routine",
];

function CoachTab() {
  const { isPremium, loading: premLoading } = usePremium();
  const { user } = useAuth();
  const remember = useServerFn(rememberFromChat);
  const locked = !premLoading && !isPremium;
  const [memoryKey, setMemoryKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useCoachChat();
  const {
    messages, input, setInput, loading, historyLoading, error,
    activeConvId, convRefreshKey, loadConversation, startNewChat,
  } = chat;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /** Send, then distil durable facts from the real exchange into coach memory. */
  const ask = async (text: string) => {
    if (locked) {
      toast.error("Upgrade to Premium to chat with the Coach.");
      return;
    }
    const reply = await chat.send(text);
    if (!reply) return;
    try {
      const { saved } = await remember({
        data: { transcript: `Member: ${text}\n\nCoach: ${reply}`.slice(0, 20000) },
      });
      if (saved > 0) setMemoryKey((k) => k + 1);
    } catch (e) {
      console.error("coach memory distil failed", e);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-2xl flex-col px-4 pt-6 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionLabel>Deluxe Coach</SectionLabel>
          <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            Your private <span className="text-gold-gradient italic">AI coach</span>
          </h1>
        </div>
        <CoachConversations
          userId={user?.id}
          activeId={activeConvId}
          refreshKey={convRefreshKey}
          onSelect={(id) => void loadConversation(id)}
          onNew={startNewChat}
        />
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

      {error && (
        <div className="mt-4 flex items-start gap-3 border border-red-500/30 bg-red-950/20 p-3.5" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1 text-xs text-muted-foreground">
            <span className="block font-display text-sm text-foreground">{COACH_FAILURE_COPY[error.kind].title}</span>
            {COACH_FAILURE_COPY[error.kind].detail}
          </div>
          {COACH_FAILURE_COPY[error.kind].retryable && (
            <button
              onClick={() => void chat.retry(error.lastText)}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 border border-gold/30 bg-deluxe-black/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold transition hover:border-gold/60 disabled:opacity-50"
            >
              <RotateCw className="h-3 w-3" /> Retry
            </button>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="mt-5 flex-1 space-y-4 overflow-y-auto border border-gold/15 bg-deluxe-forest/20 p-4"
        style={{ minHeight: 320, maxHeight: "55vh" }}
      >
        {historyLoading && messages.length === 0 && (
          <div className="h-24 animate-pulse border border-gold/10 bg-deluxe-black/40" />
        )}

        {!historyLoading && messages.length === 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void ask(s)}
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

      <CoachMemoryPanel refreshKey={memoryKey} />

      <form
        onSubmit={(e) => { e.preventDefault(); void ask(input); }}
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
      <AdaptiveWeekCard />

      <p className="mt-4 pb-4 text-center text-[10px] text-muted-foreground">
        Informational only. Consult a professional for medical concerns.
      </p>
    </div>
  );
}

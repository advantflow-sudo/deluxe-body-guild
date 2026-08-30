import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User, Crown, Lock, RotateCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { rememberFromChat } from "@/lib/coach-memory.functions";
import { CoachMemoryPanel } from "@/components/deluxe/CoachMemoryPanel";
import { AdaptiveWeekCard } from "@/components/deluxe/AdaptiveWeekCard";
import { CoachConversations } from "@/components/deluxe/CoachConversations";

export const Route = createFileRoute("/_authenticated/app/coach")({
  component: CoachTab,
});

type Msg = { role: "user" | "assistant"; content: string };

type CoachFailure = "rate_limited" | "out_of_credits" | "session_expired" | "unavailable";

const FAILURE_COPY: Record<CoachFailure, { title: string; detail: string; retryable: boolean }> = {
  rate_limited: {
    title: "Coach is rate limited",
    detail: "Too many requests in a short window. Retry in a moment.",
    retryable: true,
  },
  out_of_credits: {
    title: "AI credits exhausted",
    detail: "The workspace has run out of AI credits. Top up to bring the coach back online.",
    retryable: false,
  },
  session_expired: {
    title: "Your session expired",
    detail: "Sign in again so your requests can be authorised.",
    retryable: false,
  },
  unavailable: {
    title: "Coach is temporarily unavailable",
    detail: "The AI service didn't respond. Try again in a few seconds.",
    retryable: true,
  },
};

function classifyStatus(status: number): CoachFailure {
  if (status === 429) return "rate_limited";
  if (status === 402 || status === 403) return "out_of_credits";
  if (status === 401) return "session_expired";
  return "unavailable";
}

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
  const [messages, setMessages] = useState<Msg[]>([]);
  const conversationId = useRef<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [memoryKey, setMemoryKey] = useState(0);
  const [convRefreshKey, setConvRefreshKey] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ kind: CoachFailure; lastText: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Restore the member's most recent coach thread so context carries over.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: conv } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !conv) return;
      conversationId.current = conv.id;
      setActiveConvId(conv.id);
      const { data: msgs } = await supabase
        .from("ai_messages")
        .select("role,content")
        .eq("conversation_id", conv.id)
        .order("created_at")
        .limit(40);
      if (!cancelled && msgs?.length) setMessages(msgs as Msg[]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const loadConversation = async (id: string) => {
    conversationId.current = id;
    setActiveConvId(id);
    setError(null);
    const { data: msgs } = await supabase
      .from("ai_messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at")
      .limit(40);
    setMessages((msgs as Msg[]) ?? []);
  };

  const startNewChat = () => {
    conversationId.current = null;
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    setInput("");
  };

  /** Persist the exchange and distil durable facts into coach memory. */
  const persist = async (userText: string, assistantText: string) => {
    if (!user || !assistantText.trim()) return;
    try {
      if (!conversationId.current) {
        const { data } = await supabase
          .from("ai_conversations")
          .insert({ user_id: user.id, title: userText.slice(0, 120) })
          .select("id")
          .single();
        conversationId.current = data?.id ?? null;
        setActiveConvId(conversationId.current);
        setConvRefreshKey((k) => k + 1);
      } else {
        await supabase
          .from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId.current);
        setConvRefreshKey((k) => k + 1);
      }
      if (!conversationId.current) return;
      await supabase.from("ai_messages").insert([
        { conversation_id: conversationId.current, user_id: user.id, role: "user", content: userText.slice(0, 20000) },
        { conversation_id: conversationId.current, user_id: user.id, role: "assistant", content: assistantText.slice(0, 20000) },
      ]);
      const { saved } = await remember({
        data: { transcript: `Member: ${userText}\n\nCoach: ${assistantText}`.slice(0, 20000) },
      });
      if (saved > 0) setMemoryKey((k) => k + 1);
    } catch (e) {
      console.error("coach persistence failed", e);
    }
  };

  async function send(text: string) {
    if (!text.trim() || loading) return;
    if (locked) {
      toast.error("Upgrade to Premium to chat with the Coach.");
      return;
    }
    setError(null);
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
        const kind = classifyStatus(res.status);
        setError({ kind, lastText: userMsg.content });
        setMessages((prev) => prev.slice(0, -1));
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
      if (!assistant.trim()) {
        setError({ kind: "unavailable", lastText: userMsg.content });
        setMessages((prev) => prev.slice(0, -2));
      } else {
        void persist(userMsg.content, assistant);
      }
    } catch (e) {
      console.error(e);
      setError({ kind: "unavailable", lastText: userMsg.content });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

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
          onSelect={loadConversation}
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
        <div className="mt-4 flex items-start gap-3 border border-red-500/30 bg-red-950/20 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1 text-xs text-muted-foreground">
            <span className="block font-display text-sm text-foreground">{FAILURE_COPY[error.kind].title}</span>
            {FAILURE_COPY[error.kind].detail}
          </div>
          {FAILURE_COPY[error.kind].retryable && (
            <button
              onClick={() => send(error.lastText)}
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

      <CoachMemoryPanel refreshKey={memoryKey} />

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
      <AdaptiveWeekCard />

      <p className="mt-4 pb-4 text-center text-[10px] text-muted-foreground">
        Informational only. Consult a professional for medical concerns.
      </p>
    </div>
  );
}

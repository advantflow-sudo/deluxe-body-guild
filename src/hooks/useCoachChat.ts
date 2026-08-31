/**
 * Shared Deluxe Coach chat engine.
 *
 * One place that owns: loading a member's real conversation history, streaming
 * replies from /api/chat, persisting EVERY turn (user row written before the
 * stream starts, assistant row written as soon as the stream finishes), failure
 * classification and retry. Both the public /coach page and the in-app coach
 * tab use this so history is identical wherever the member chats.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CoachMsg = { role: "user" | "assistant"; content: string };

export type CoachFailure = "rate_limited" | "out_of_credits" | "session_expired" | "unavailable";

export const COACH_FAILURE_COPY: Record<
  CoachFailure,
  { title: string; detail: string; retryable: boolean }
> = {
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

export function useCoachChat(options?: { onPersisted?: () => void }) {
  const { user } = useAuth();
  const onPersisted = options?.onPersisted;
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<{ kind: CoachFailure; lastText: string } | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convRefreshKey, setConvRefreshKey] = useState(0);
  const conversationId = useRef<string | null>(null);

  /** Load (or create) the conversation row this turn belongs to. */
  const ensureConversation = useCallback(
    async (title: string): Promise<string | null> => {
      if (!user) return null;
      if (conversationId.current) return conversationId.current;
      const { data, error: convErr } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title: title.slice(0, 120) || "New chat" })
        .select("id")
        .single();
      if (convErr) {
        console.error("coach conversation create failed", convErr);
        return null;
      }
      conversationId.current = data.id;
      setActiveConvId(data.id);
      setConvRefreshKey((k) => k + 1);
      return data.id;
    },
    [user],
  );

  const saveMessage = useCallback(
    async (convId: string, role: "user" | "assistant", content: string) => {
      if (!user || !content.trim()) return;
      const { error: msgErr } = await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role,
        content: content.slice(0, 20000),
      });
      if (msgErr) console.error("coach message save failed", msgErr);
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
      setConvRefreshKey((k) => k + 1);
      onPersisted?.();
    },
    [user, onPersisted],
  );

  const loadConversation = useCallback(async (id: string) => {
    conversationId.current = id;
    setActiveConvId(id);
    setError(null);
    const { data } = await supabase
      .from("ai_messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at")
      .limit(200);
    setMessages((data as CoachMsg[]) ?? []);
  }, []);

  /** Restore the most recent thread so the member's real Q&A history is there. */
  useEffect(() => {
    if (!user) {
      setHistoryLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: conv } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) {
        return;
      }
      if (!conv) {
        setHistoryLoading(false);
        return;
      }
      conversationId.current = conv.id;
      setActiveConvId(conv.id);
      const { data: msgs } = await supabase
        .from("ai_messages")
        .select("role,content")
        .eq("conversation_id", conv.id)
        .order("created_at")
        .limit(200);
      if (!cancelled) {
        if (msgs?.length) setMessages(msgs as CoachMsg[]);
        setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const startNewChat = useCallback(() => {
    conversationId.current = null;
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || loading || !user) return;
      setError(null);
      const next: CoachMsg[] = [...messages, { role: "user", content: clean }];
      setMessages(next);
      setInput("");
      setLoading(true);

      // Persist the question immediately so nothing is lost if the reply fails.
      const convId = await ensureConversation(clean);
      if (convId) await saveMessage(convId, "user", clean);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-deluxe-client": "coach",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ messages: next, client: "coach" }),
        });
        if (!res.ok || !res.body) {
          setError({ kind: classifyStatus(res.status), lastText: clean });
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
            if (json === "[DONE]") {
              done = true;
              break;
            }
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
          setError({ kind: "unavailable", lastText: clean });
          setMessages((prev) => prev.slice(0, -1));
        } else if (convId) {
          await saveMessage(convId, "assistant", assistant);
        }
        return assistant;
      } catch (e) {
        console.error("coach send failed", e);
        setError({ kind: "unavailable", lastText: clean });
      } finally {
        setLoading(false);
      }
      return undefined;
    },
    [ensureConversation, loading, messages, saveMessage, user],
  );

  /** Retry the last failed question without duplicating it in the transcript. */
  const retry = useCallback(
    async (text: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === "user" && last.content === text ? prev.slice(0, -1) : prev;
      });
      await send(text);
    },
    [send],
  );

  return {
    messages,
    input,
    setInput,
    loading,
    historyLoading,
    error,
    dismissError: () => setError(null),
    send,
    retry,
    activeConvId,
    convRefreshKey,
    loadConversation,
    startNewChat,
  };
}

import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("Please sign in again");
  return { Authorization: `Bearer ${t}` };
}

async function readError(res: Response) {
  const txt = await res.text();
  try { return (JSON.parse(txt) as { error?: string | { message?: string } }).error; } catch { return txt; }
}

/** Sends a finished recording and returns the final transcript. */
export async function transcribeRecording(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await fetch("/api/voice/transcribe", { method: "POST", headers: await authHeader(), body: form });
  if (!res.ok || !res.body) {
    const e = await readError(res);
    throw new Error(typeof e === "string" ? e : e?.message ?? `Couldn't hear that (${res.status})`);
  }
  let text = "";
  let final: string | null = null;
  const parser = createParser({
    onEvent(ev) {
      if (ev.data === "[DONE]") return;
      const p = JSON.parse(ev.data) as { type?: string; delta?: string; text?: string; error?: { message?: string } };
      if (p.error) throw new Error(p.error.message ?? "Transcription failed");
      if (p.type === "transcript.text.delta" && p.delta) text += p.delta;
      if (p.type === "transcript.text.done") final = p.text ?? text;
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const n = await reader.read();
    if (n.done) break;
    parser.feed(n.value);
  }
  if (final === null) throw new Error("Transcription was interrupted — please try again");
  return (final as string).trim();
}

/** Strips markdown so the Coach doesn't read symbols aloud. */
export function speakable(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_#>`~|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);
}

/**
 * Streams the Coach's spoken reply. `context` must be created during a tap
 * (iPhone only allows sound that starts from a user gesture).
 */
export async function speakReply(context: AudioContext, text: string, signal?: AbortSignal) {
  const sources = new Set<AudioBufferSourceNode>();
  let playhead = 0, pending = new Uint8Array(0), completed = false, played = 0;
  let playback: Promise<void> = Promise.resolve();
  const stopAll = () => { for (const s of sources) { try { s.stop(); } catch { /* already stopped */ } } };
  signal?.addEventListener("abort", stopAll, { once: true });
  if (context.state === "suspended") await context.resume();
  const res = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { ...(await authHeader()), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok || !res.body) {
    const e = await readError(res);
    throw new Error(typeof e === "string" ? e : e?.message ?? `Voice reply failed (${res.status})`);
  }
  const parser = createParser({
    onEvent(ev) {
      const p = JSON.parse(ev.data) as { type: string; audio?: string; error?: unknown };
      if (p.type === "error" || p.error) throw new Error("Voice reply failed");
      if (p.type === "speech.audio.done") { completed = true; return; }
      if (p.type !== "speech.audio.delta" || !p.audio) return;
      const incoming = Uint8Array.from(atob(p.audio), (c) => c.charCodeAt(0));
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending); bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      const view = new DataView(bytes.buffer);
      const samples = new Float32Array(usable / 2);
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
      pending = bytes.slice(usable);
      if (!samples.length) return;
      played += samples.length;
      const buf = context.createBuffer(1, samples.length, 24000);
      buf.copyToChannel(samples, 0);
      const src = context.createBufferSource();
      src.buffer = buf; src.connect(context.destination); sources.add(src);
      playback = new Promise((r) => { src.onended = () => { sources.delete(src); r(); }; });
      playhead = Math.max(playhead, context.currentTime + 0.05);
      src.start(playhead);
      playhead += buf.duration;
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const n = await reader.read();
      if (n.done) break;
      parser.feed(n.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!completed || !played) throw new Error("Voice reply was cut off");
  await playback;
}

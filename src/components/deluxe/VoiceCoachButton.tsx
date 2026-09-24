import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordWav } from "@/lib/recordWav";
import { speakReply, speakable, transcribeRecording } from "@/lib/voiceClient";
import { haptic } from "@/hooks/useHaptics";

const KEY = "deluxe_voice_replies";
type Phase = "idle" | "listening" | "thinking" | "speaking";

/** Tap to talk, tap to stop. The Coach answers in text and (optionally) out loud. */
export function VoiceCoachButton({ disabled, ask }: { disabled?: boolean; ask: (text: string) => Promise<string | null | undefined> }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [speakOn, setSpeakOn] = useState(true);
  const rec = useRef<{ stop: () => Promise<File> } | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { setSpeakOn(localStorage.getItem(KEY) !== "off"); }, []);
  useEffect(() => () => { abort.current?.abort(); void ctx.current?.close(); }, []);

  const toggleSpeak = () => {
    const next = !speakOn;
    setSpeakOn(next);
    localStorage.setItem(KEY, next ? "on" : "off");
    if (!next) abort.current?.abort();
  };

  const onTap = async () => {
    haptic("selection");
    if (phase === "speaking") { abort.current?.abort(); setPhase("idle"); return; }
    if (phase === "listening") {
      setPhase("thinking");
      try {
        const file = await rec.current!.stop();
        rec.current = null;
        const text = await transcribeRecording(file);
        if (!text) { toast.message("I didn't catch that — try again."); setPhase("idle"); return; }
        const reply = await ask(text);
        if (reply && speakOn && ctx.current) {
          setPhase("speaking");
          abort.current = new AbortController();
          await speakReply(ctx.current, speakable(reply), abort.current.signal);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
      }
      setPhase("idle");
      return;
    }
    try {
      // Created inside the tap so iPhone allows the spoken reply to play.
      if (!ctx.current || ctx.current.state === "closed") ctx.current = new AudioContext({ sampleRate: 24000 });
      void ctx.current.resume();
      rec.current = await recordWav();
      setPhase("listening");
    } catch (e) {
      const msg = (e as Error).name === "NotAllowedError"
        ? "Microphone access is blocked. Allow it in your phone's settings for this app."
        : (e as Error).message;
      toast.error(msg);
    }
  };

  const label = { idle: "Talk to the Coach", listening: "Tap to send", thinking: "Thinking…", speaking: "Tap to stop" }[phase];

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={() => void onTap()}
        disabled={disabled || phase === "thinking"}
        aria-label={label}
        className={`flex flex-1 items-center justify-center gap-2 border py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition disabled:opacity-50 ${
          phase === "listening" ? "animate-pulse border-gold bg-gold/20 text-gold" : "border-gold/30 bg-deluxe-black/60 text-gold hover:border-gold/60"
        }`}
      >
        {phase === "thinking" ? <Loader2 className="h-4 w-4 animate-spin" /> : phase === "listening" || phase === "speaking" ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {label}
      </button>
      <button
        type="button"
        onClick={toggleSpeak}
        aria-pressed={speakOn}
        aria-label={speakOn ? "Coach speaks replies — tap to mute" : "Coach replies muted — tap to hear replies"}
        className="border border-gold/30 bg-deluxe-black/60 p-3 text-gold"
      >
        {speakOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
}

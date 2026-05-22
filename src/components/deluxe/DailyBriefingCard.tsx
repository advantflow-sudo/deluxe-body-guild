import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sunrise, Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { dailyBriefing } from "@/lib/ai.functions";
import { SectionLabel } from "@/components/deluxe/ui";

const KEY = "deluxe.dailyBriefing";
const today = () => new Date().toISOString().slice(0, 10);

export function DailyBriefingCard() {
  const fn = useServerFn(dailyBriefing);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run(force = false) {
    if (loading) return;
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(KEY) || "null");
        if (cached?.date === today() && cached.text) {
          setText(cached.text);
          return;
        }
      } catch {}
    }
    setLoading(true);
    try {
      const r = await fn({ data: undefined as any });
      setText(r.briefing);
      localStorage.setItem(KEY, JSON.stringify({ date: today(), text: r.briefing }));
    } catch {
      setText("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(false); /* eslint-disable-next-line */ }, []);

  return (
    <div className="mt-5 border border-gold/25 bg-deluxe-forest/20 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-gold" />
          <SectionLabel>Today's AI Briefing</SectionLabel>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => run(true)}
            disabled={loading}
            className="text-muted-foreground hover:text-gold disabled:opacity-50"
            aria-label="Refresh briefing"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
          <Link to="/app/ai" className="text-[10px] uppercase tracking-[0.2em] text-gold hover:underline">
            Studio
          </Link>
        </div>
      </div>

      <div className="mt-3 min-h-[3rem] text-sm text-foreground">
        {loading && !text && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
            Reading your training, recovery & nutrition…
          </div>
        )}
        {text && (
          <div className="prose-deluxe">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
        {!loading && !text && (
          <button
            onClick={() => run(true)}
            className="inline-flex items-center gap-2 border border-gold/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground hover:border-gold"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" /> Generate today's briefing
          </button>
        )}
      </div>
    </div>
  );
}

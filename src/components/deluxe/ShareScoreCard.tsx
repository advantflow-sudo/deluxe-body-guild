import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number; // 0–100
  streak: number;
}

const W = 1080;
const H = 1920;

export function ShareScoreCard({ open, onOpenChange, score, streak }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [name, setName] = useState("Athlete");
  const [busy, setBusy] = useState(false);

  // Fetch display name
  useEffect(() => {
    if (!user || !open) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setName(data.display_name.split(" ")[0]); });
  }, [user, open]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Background: deep gold→black radial + matte black overlay
    const grad = ctx.createRadialGradient(W / 2, H / 2.6, 60, W / 2, H / 2.6, 1100);
    grad.addColorStop(0, "#1a1505");
    grad.addColorStop(0.5, "#0a0a0a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Subtle vignette + gold edge frame
    ctx.strokeStyle = "rgba(212,175,55,0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = "rgba(212,175,55,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // Wordmark
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#d4af37";
    ctx.font = '600 38px "Inter", system-ui, sans-serif';
    ctx.letterSpacing = "8px" as unknown as string;
    ctx.fillText("D E L U X E   F I T N E S S", W / 2, 200);

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = '500 28px "Inter", system-ui, sans-serif';
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    ctx.fillText(dateStr.toUpperCase(), W / 2, 260);

    // Ring
    const cx = W / 2, cy = 800, r = 320;
    ctx.lineWidth = 36;
    ctx.strokeStyle = "rgba(212,175,55,0.18)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    ringGrad.addColorStop(0, "#f5d97a");
    ringGrad.addColorStop(1, "#d4af37");
    ctx.strokeStyle = ringGrad;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.min(score, 100) / 100) * Math.PI * 2);
    ctx.stroke();

    // Number
    ctx.fillStyle = "#fff8df";
    ctx.font = '700 240px "Playfair Display", "Times New Roman", serif';
    ctx.fillText(String(score), cx, cy - 30);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = '500 40px "Inter", system-ui, sans-serif';
    ctx.fillText("/ 100  DELUXE SCORE", cx, cy + 130);

    // Rating banner
    const rating = score >= 100 ? "PERFECT" : score >= 90 ? "ELITE" : score >= 75 ? "STRONG" : score >= 50 ? "IMPROVING" : "REBUILD";
    ctx.fillStyle = "#d4af37";
    ctx.font = '700 64px "Inter", system-ui, sans-serif';
    ctx.fillText(rating, cx, 1280);

    // Streak
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = '500 38px "Inter", system-ui, sans-serif';
    ctx.fillText(`${streak}-DAY STREAK`, cx, 1380);

    // Name
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = '400 32px "Inter", system-ui, sans-serif';
    ctx.fillText(`— ${name.toUpperCase()}`, cx, 1460);

    // Footer
    ctx.fillStyle = "rgba(212,175,55,0.7)";
    ctx.font = '600 28px "Inter", system-ui, sans-serif';
    ctx.fillText("deluxefitness.app", cx, H - 160);
  }, [score, streak, name]);

  useEffect(() => { if (open) requestAnimationFrame(draw); }, [open, draw]);

  const toBlob = (): Promise<Blob | null> =>
    new Promise((res) => canvasRef.current?.toBlob((b) => res(b), "image/png", 0.95));

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not generate image");
      const file = new File([blob], `deluxe-score-${new Date().toISOString().slice(0, 10)}.png`, { type: "image/png" });

      const canShareFile = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });
      if (canShareFile && navigator.share) {
        await navigator.share({
          files: [file],
          title: "My Deluxe Score",
          text: `${score}/100 Deluxe Score · ${streak}-day streak`,
        });
      } else {
        downloadBlob(blob, file.name);
        toast.success("Saved to your downloads");
      }
    } catch (err) {
      const e = err as Error;
      if (e.name !== "AbortError") toast.error(`Share failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not generate image");
      downloadBlob(blob, `deluxe-score-${new Date().toISOString().slice(0, 10)}.png`);
      toast.success("Image downloaded");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border border-gold/30 bg-deluxe-black p-0 text-foreground"
        aria-describedby="share-card-description"
      >
        <DialogHeader className="px-5 pt-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Share</div>
              <DialogTitle className="font-display text-xl text-foreground">Your Deluxe Card</DialogTitle>
              <p id="share-card-description" className="mt-1 text-xs text-muted-foreground">
                Preview, then share or download as PNG.
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close share dialog"
              className="flex h-8 w-8 items-center justify-center border border-gold/20 text-muted-foreground hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="border border-gold/20 bg-deluxe-forest/20">
            <canvas
              ref={canvasRef}
              className="block aspect-[9/16] w-full"
              aria-label={`Shareable card: ${score} of 100 Deluxe Score, ${streak} day streak`}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 bg-gold py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-deluxe-black hover:bg-gold-light disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="flex items-center justify-center gap-2 border border-gold/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
              PNG
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

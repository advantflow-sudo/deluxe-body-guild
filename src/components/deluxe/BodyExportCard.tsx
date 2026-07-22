import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Printer, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExportMuscle { label: string; color: string; tagline: string }
interface ExportWorkout { title: string; category: string; level: string; duration_min: number; reasons: string[] }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscles: ExportMuscle[];
  workouts: ExportWorkout[];
  view: "front" | "back";
}

const W = 1080;
const H = 1920;

export function BodyExportCard({ open, onOpenChange, muscles, workouts, view }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Background
    const grad = ctx.createRadialGradient(W / 2, H / 3, 80, W / 2, H / 3, 1200);
    grad.addColorStop(0, "#1a1505");
    grad.addColorStop(0.5, "#0a0a0a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Frame
    ctx.strokeStyle = "rgba(212,175,55,0.35)";
    ctx.lineWidth = 4; ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = "rgba(212,175,55,0.12)";
    ctx.lineWidth = 1; ctx.strokeRect(60, 60, W - 120, H - 120);

    // Header
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#d4af37";
    ctx.font = '600 34px "Inter", system-ui, sans-serif';
    ctx.fillText("D E L U X E   F I T N E S S", W / 2, 170);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = '500 22px "Inter", system-ui, sans-serif';
    ctx.fillText(`TARGET YOUR BODY  ·  ${view.toUpperCase()}`, W / 2, 215);

    // Title
    ctx.fillStyle = "#fff8df";
    ctx.font = '700 68px "Playfair Display", "Times New Roman", serif';
    ctx.fillText("Muscle Targets", W / 2, 320);

    // Muscle chips
    let y = 420;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const startX = 120;
    let x = startX;
    ctx.font = '600 26px "Inter", system-ui, sans-serif';
    if (muscles.length === 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("No muscles selected", W / 2, y);
      y += 60;
    } else {
      for (const m of muscles) {
        const label = m.label.toUpperCase();
        const w = ctx.measureText(label).width + 60;
        if (x + w > W - 120) { x = startX; y += 70; }
        // pill
        ctx.fillStyle = `${m.color}30`;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        roundRect(ctx, x, y - 28, w, 56, 28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = m.color;
        ctx.fillText(label, x + 30, y);
        x += w + 14;
      }
      y += 80;
    }

    // Workouts header
    ctx.textAlign = "center";
    ctx.fillStyle = "#d4af37";
    ctx.font = '700 44px "Playfair Display", "Times New Roman", serif';
    ctx.fillText("Recommended Workouts", W / 2, y + 20);
    y += 90;

    // Workouts list
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    for (const w of workouts) {
      if (y > H - 260) break;
      // card
      ctx.fillStyle = "rgba(20,25,20,0.6)";
      ctx.strokeStyle = "rgba(212,175,55,0.25)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 100, y, W - 200, 150, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff8df";
      ctx.font = '600 32px "Inter", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, w.title, W - 260), 130, y + 24);
      ctx.fillStyle = "rgba(212,175,55,0.85)";
      ctx.font = '500 20px "Inter", system-ui, sans-serif';
      ctx.fillText(`${w.category.toUpperCase()} · ${w.level.toUpperCase()} · ${w.duration_min} MIN`, 130, y + 68);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = '400 20px "Inter", system-ui, sans-serif';
      const why = w.reasons.slice(0, 2).join("  •  ");
      ctx.fillText(truncate(ctx, `Why: ${why}`, W - 260), 130, y + 104);
      y += 170;
    }

    // Footer
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212,175,55,0.75)";
    ctx.font = '600 24px "Inter", system-ui, sans-serif';
    ctx.fillText("deluxefitness.app", W / 2, H - 140);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = '400 18px "Inter", system-ui, sans-serif';
    ctx.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), W / 2, H - 110);
  }, [muscles, workouts, view]);

  useEffect(() => { if (open) requestAnimationFrame(draw); }, [open, draw]);

  const toBlob = (): Promise<Blob | null> =>
    new Promise((res) => canvasRef.current?.toBlob((b) => res(b), "image/png", 0.95));

  const filename = () => `deluxe-targets-${new Date().toISOString().slice(0, 10)}.png`;

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not generate image");
      const file = new File([blob], filename(), { type: "image/png" });
      const canShareFile = typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });
      if (canShareFile && navigator.share) {
        await navigator.share({ files: [file], title: "My Muscle Targets", text: "My Deluxe Fitness muscle targets & recommended workouts" });
      } else {
        downloadBlob(blob, file.name);
        toast.success("Saved to your downloads");
      }
    } catch (err) {
      const e = err as Error;
      if (e.name !== "AbortError") toast.error(`Share failed: ${e.message}`);
    } finally { setBusy(false); }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not generate image");
      downloadBlob(blob, filename());
      toast.success("PNG downloaded");
    } finally { setBusy(false); }
  };

  const handlePrint = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) throw new Error("Could not generate image");
      const url = URL.createObjectURL(blob);
      const win = window.open("", "_blank", "noopener,width=900,height=1200");
      if (!win) { downloadBlob(blob, filename()); return; }
      win.document.write(`<!doctype html><title>Deluxe Muscle Targets</title>
<style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}
img{max-width:100%;height:auto}@media print{body{background:#fff}}</style>
<img src="${url}" onload="setTimeout(()=>window.print(),200)" alt="Deluxe muscle targets" />`);
      win.document.close();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-gold/30 bg-deluxe-black p-0 text-foreground" aria-describedby="export-desc">
        <DialogHeader className="px-5 pt-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Export</div>
              <DialogTitle className="font-display text-xl text-foreground">Muscle Targets Summary</DialogTitle>
              <p id="export-desc" className="mt-1 text-xs text-muted-foreground">Share, download PNG, or print to PDF.</p>
            </div>
            <button onClick={() => onOpenChange(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center border border-gold/20 text-muted-foreground hover:text-gold">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        <div className="px-5 pb-5">
          <div className="border border-gold/20 bg-deluxe-forest/20">
            <canvas ref={canvasRef} className="block aspect-[9/16] w-full" aria-label="Muscle targets summary preview" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleShare} disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 bg-gold py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-deluxe-black hover:bg-gold-light disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />} Share
            </button>
            <button type="button" onClick={handleDownload} disabled={busy}
              className="flex items-center justify-center gap-2 border border-gold/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10 disabled:opacity-50" aria-label="Download PNG">
              <Download className="h-4 w-4" /> PNG
            </button>
            <button type="button" onClick={handlePrint} disabled={busy}
              className="flex items-center justify-center gap-2 border border-gold/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10 disabled:opacity-50" aria-label="Print to PDF">
              <Printer className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

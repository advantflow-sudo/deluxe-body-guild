import type { Recap } from "@/lib/workoutRecap";

/** Draws a branded 1080×1920 story image for a finished session and returns a JPEG blob. */
export async function renderStoryCard(r: Recap): Promise<Blob> {
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const gold = "#D4AF6A", ivory = "#F4EEE1", muted = "#9A927F";

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#14201A"); bg.addColorStop(1, "#050505");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = gold; g.lineWidth = 4; g.strokeRect(48, 48, W - 96, H - 96);

  g.textAlign = "center";
  g.fillStyle = gold; g.font = "600 34px serif";
  g.fillText("DELUXE FITNESS", W / 2, 170);
  g.fillStyle = muted; g.font = "28px sans-serif";
  g.fillText(`SESSION RECAP · ${r.type.toUpperCase()}`, W / 2, 230);

  g.fillStyle = ivory; g.font = "bold 92px serif";
  wrap(g, r.workout, W / 2, 420, W - 200, 104);

  const stats: [string, string][] = [
    [String(r.durationMin), "MIN"],
    [String(r.workingSets), "SETS"],
    [r.volumeKg ? r.volumeKg.toLocaleString() : "—", "KG VOLUME"],
    [`+${r.xp}`, "XP"],
  ];
  stats.forEach(([v, l], i) => {
    const x = 140 + (i % 2) * 400 + 200, y = 720 + Math.floor(i / 2) * 260;
    g.fillStyle = gold; g.font = "bold 110px serif"; g.fillText(v, x, y);
    g.fillStyle = muted; g.font = "28px sans-serif"; g.fillText(l, x, y + 56);
  });

  let y = 1300;
  g.font = "40px sans-serif";
  for (const p of r.pbs.slice(0, 3)) {
    g.fillStyle = gold; g.fillText(`★ New PB · ${p.name} ${p.kg}kg × ${p.reps}`, W / 2, y); y += 70;
  }
  const muscles = Object.keys(r.muscles);
  if (muscles.length) {
    g.fillStyle = ivory; g.font = "36px sans-serif";
    wrap(g, `Trained: ${muscles.join(" · ")}`, W / 2, y + 30, W - 220, 50);
  }
  if (r.streak > 0) {
    g.fillStyle = gold; g.font = "bold 48px sans-serif";
    g.fillText(`🔥 ${r.streak}-day streak`, W / 2, 1720);
  }

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not create image"))), "image/jpeg", 0.9));
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > max && line) { g.fillText(line, x, y); line = w; y += lh; } else line = t;
  }
  if (line) g.fillText(line, x, y);
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpDown, Lock, Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { MILESTONES, nextMilestone } from "@/components/deluxe/StreakBadges";
import { haptic } from "@/hooks/useHaptics";

export const Route = createFileRoute("/_authenticated/app/badges")({
  component: BadgeGallery,
  head: () => ({
    meta: [
      { title: "Achievement Badges | Deluxe Fitness" },
      {
        name: "description",
        content:
          "Review your unlocked and locked Deluxe Fitness streak badges and share a luxury achievement card to your community timeline.",
      },
      { property: "og:title", content: "Achievement Badges | Deluxe Fitness" },
      {
        property: "og:description",
        content: "Your XP streak milestones, unlocked in gold.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function BadgeGallery() {
  const { user } = useAuth();
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.rpc("get_xp_streak" as never);
      const s = (data ?? {}) as { current_streak?: number; longest_streak?: number };
      if (!alive) return;
      setStreak({ current: Number(s.current_streak ?? 0), best: Number(s.longest_streak ?? 0) });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const unlockedCount = MILESTONES.filter((m) => streak.best >= m.days).length;
  const next = nextMilestone(streak.best);
  const highest = [...MILESTONES].reverse().find((m) => streak.best >= m.days) ?? null;

  const visible = MILESTONES.filter((m) =>
    filter === "all" ? true : filter === "unlocked" ? streak.best >= m.days : streak.best < m.days,
  ).sort((a, b) => (sort === "asc" ? a.days - b.days : b.days - a.days));

  function drawCard(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const w = 1080;
    const h = 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#07100c");
    bg.addColorStop(0.55, "#0b1a13");
    bg.addColorStop(1, "#050807");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(212,175,55,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, w - 96, h - 96);

    ctx.textAlign = "center";
    ctx.fillStyle = "#d4af37";
    ctx.font = "600 30px Georgia, serif";
    ctx.fillText("D E L U X E   F I T N E S S", w / 2, 150);

    ctx.fillStyle = "#f5f1e6";
    ctx.font = "700 96px Georgia, serif";
    ctx.fillText(highest ? highest.name : "In Pursuit", w / 2, 400);

    ctx.fillStyle = "#d4af37";
    ctx.font = "500 40px Helvetica, Arial, sans-serif";
    ctx.fillText(
      highest ? `${highest.days}-day perfect mission streak` : "Building the first streak",
      w / 2,
      470,
    );

    // Badge row
    const boxW = 190;
    const gap = 28;
    const totalW = MILESTONES.length * boxW + (MILESTONES.length - 1) * gap;
    let x = (w - totalW) / 2;
    for (const m of MILESTONES) {
      const on = streak.best >= m.days;
      ctx.fillStyle = on ? "rgba(212,175,55,0.16)" : "rgba(255,255,255,0.04)";
      ctx.fillRect(x, 570, boxW, 210);
      ctx.strokeStyle = on ? "rgba(212,175,55,0.7)" : "rgba(212,175,55,0.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 570, boxW, 210);
      ctx.fillStyle = on ? "#d4af37" : "rgba(245,241,230,0.35)";
      ctx.font = "700 62px Georgia, serif";
      ctx.fillText(`${m.days}`, x + boxW / 2, 668);
      ctx.font = "500 22px Helvetica, Arial, sans-serif";
      ctx.fillText(m.name.toUpperCase(), x + boxW / 2, 720);
      ctx.font = "400 20px Helvetica, Arial, sans-serif";
      ctx.fillText(on ? "UNLOCKED" : "LOCKED", x + boxW / 2, 752);
      x += boxW + gap;
    }

    ctx.fillStyle = "#f5f1e6";
    ctx.font = "500 34px Helvetica, Arial, sans-serif";
    ctx.fillText(`Current streak ${streak.current} · Best ${streak.best}`, w / 2, 880);
    ctx.fillStyle = "rgba(212,175,55,0.75)";
    ctx.font = "400 26px Helvetica, Arial, sans-serif";
    ctx.fillText("deluxefitness.app", w / 2, 960);

    return canvas;
  }

  async function download() {
    haptic("light");
    const canvas = drawCard();
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "deluxe-badges.png";
    a.click();
    toast.success("Share image saved");
  }

  async function shareToCommunity() {
    if (!user) return;
    haptic("medium");
    setSharing(true);
    try {
      const canvas = drawCard();
      if (!canvas) throw new Error("Could not render the card");
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png", 0.92));
      if (!blob) throw new Error("Could not render the card");

      const path = `${user.id}/badges/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);

      const body = highest
        ? `${highest.name} unlocked — ${highest.days}-day perfect mission streak. ${unlockedCount}/${MILESTONES.length} badges secured. #DeluxeStreak`
        : `Chasing my first streak badge — ${streak.current} day${streak.current === 1 ? "" : "s"} in. #DeluxeStreak`;

      const { error: postErr } = await supabase.from("community_posts").insert({
        user_id: user.id,
        body,
        image_url: pub.publicUrl,
        visibility: "public",
      });
      if (postErr) throw postErr;

      toast.success("Posted to your community timeline");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't share your badges");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="px-4 pb-28 pt-5">
      <Link
        to="/app"
        className="mb-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>

      <h1 className="font-serif text-2xl text-foreground">Badge Gallery</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        {loading
          ? "Loading your achievements…"
          : `${unlockedCount} of ${MILESTONES.length} unlocked${next ? ` · ${next.days - streak.best} perfect days to ${next.name}` : " · complete set"}`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="group" aria-label="Filter badges">
          {([
            { v: "all" as const, l: `All ${MILESTONES.length}` },
            { v: "unlocked" as const, l: `Unlocked ${unlockedCount}` },
            { v: "locked" as const, l: `Locked ${MILESTONES.length - unlockedCount}` },
          ]).map((o) => (
            <button
              key={o.v}
              type="button"
              aria-pressed={filter === o.v}
              onClick={() => {
                haptic("selection");
                setFilter(o.v);
              }}
              className={`min-h-10 border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
                filter === o.v ? "border-gold/60 bg-gold/12 text-gold" : "border-gold/15 text-muted-foreground hover:text-gold"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setSort(sort === "asc" ? "desc" : "asc");
          }}
          className="ml-auto inline-flex min-h-10 items-center gap-2 border border-gold/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition hover:border-gold/50 hover:text-gold"
        >
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden /> {sort === "asc" ? "Low to high" : "High to low"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Jump to milestone">
        {[...MILESTONES]
          .sort((a, b) => a.days - b.days)
          .map((m) => (
            <button
              key={m.days}
              type="button"
              onClick={() => {
                haptic("light");
                setFilter("all");
                setSelected(m.days);
                document.getElementById(`badge-${m.days}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`min-h-9 border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition ${
                selected === m.days ? "border-gold/60 text-gold" : "border-gold/15 text-muted-foreground hover:text-gold"
              }`}
            >
              {m.days}d
            </button>
          ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visible.length === 0 && (
          <p className="col-span-full text-[11px] text-muted-foreground">
            {filter === "locked" ? "Every badge is unlocked. Impeccable." : "No badges unlocked yet — start a streak today."}
          </p>
        )}
        {visible.map((m) => {
          const Icon = m.icon;
          const unlocked = streak.best >= m.days;
          const live = streak.current >= m.days;
          const open = selected === m.days;
          return (
            <button
              key={m.days}
              id={`badge-${m.days}`}
              type="button"
              
              onClick={() => {
                haptic("light");
                setSelected(open ? null : m.days);
              }}
              aria-expanded={open}
              aria-label={`${m.name} badge, ${unlocked ? "unlocked" : "locked"}`}
              className={`flex scroll-mt-24 flex-col items-center gap-2 border p-4 text-center transition ${
                unlocked
                  ? "border-gold/45 bg-gradient-to-b from-gold/12 to-transparent"
                  : "border-gold/10 bg-deluxe-black/40 opacity-60"
              } ${live ? "shadow-[0_0_26px_-8px_hsl(var(--gold))]" : ""} ${open ? "ring-1 ring-gold/40" : ""}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  unlocked ? "bg-gold text-deluxe-black" : "border border-gold/25 text-muted-foreground"
                }`}
              >
                {unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </span>
              <span className={`text-[10px] uppercase tracking-[0.16em] ${unlocked ? "text-gold" : "text-muted-foreground"}`}>
                {m.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{m.days} days</span>
              {open && (
                <span className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  {m.blurb}. {unlocked ? "Unlocked permanently." : `Best streak so far: ${streak.best} days.`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Share your achievement</SectionLabel>
        <p className="mt-2 text-xs text-muted-foreground">
          Generates a gold-on-obsidian card with your badges and streak, ready for your community timeline.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <GoldButton onClick={shareToCommunity} disabled={sharing || loading} className="w-full">
            <Share2 className="mr-2 inline h-4 w-4" />
            {sharing ? "Posting…" : "Post to community"}
          </GoldButton>
          <OutlineButton onClick={download} disabled={loading} className="w-full">
            <Download className="mr-2 inline h-4 w-4" /> Download image
          </OutlineButton>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}

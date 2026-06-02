import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download, ClipboardCheck, Wand2, TrendingUp, Users, ArrowRight,
} from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Deluxe Fitness" },
      { name: "description", content: "Five steps from download to transformation. Assessment, AI-powered plan, tracking, rewards, and community." },
      { property: "og:title", content: "How Deluxe Fitness Works" },
      { property: "og:description", content: "From download to transformation in five steps." },
      { property: "og:url", content: "https://deluxefitness.app/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    Icon: Download,
    title: "Download Deluxe Fitness",
    body:
      "Start on iOS or Android. Sign up takes under a minute. No card required for your first 24 hours.",
    detail: ["iOS + Android native", "Apple Health & Google Fit sync", "Optional wearable pairing"],
  },
  {
    Icon: ClipboardCheck,
    title: "Complete your assessment",
    body:
      "Tell us about your training history, lifestyle, current goals and where you want to be in 12 weeks.",
    detail: ["Strength & conditioning baseline", "Lifestyle + sleep profile", "Mindset & motivation snapshot"],
  },
  {
    Icon: Wand2,
    title: "Receive your AI-powered plan",
    body:
      "Your dedicated AI Coach builds a training, nutrition and recovery plan tuned to your level — and adapts weekly.",
    detail: ["12-week periodized programming", "Macro & meal guidance", "Recovery + sleep prescription"],
  },
  {
    Icon: TrendingUp,
    title: "Track progress, earn rewards",
    body:
      "Log workouts, hit hydration and step goals, build streaks. Every action feeds your Deluxe Score and unlocks tangible rewards.",
    detail: ["Live Deluxe Score", "Streak system with weekly freezes", "Bronze / Gold / Deluxe tiers"],
  },
  {
    Icon: Users,
    title: "Join the movement",
    body:
      "Get matched with an accountability partner. Enter challenges. Climb the leaderboard. Become part of something bigger.",
    detail: ["Auto-matched accountability partner", "Weekly + seasonal challenges", "Members-only community feed"],
  },
];

function HowItWorksPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="The Journey"
        title="Five steps."
        highlight="One transformation."
        body="From download to deluxe — exactly how Deluxe Fitness becomes the operating system for your life."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-5xl px-6">
          <ol className="space-y-12">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="grid items-start gap-8 border border-gold/20 bg-deluxe-card p-8 md:grid-cols-[140px_1fr] md:gap-12"
              >
                <div className="text-center md:text-left">
                  <div className="font-display text-6xl text-gold-gradient">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <s.Icon className="mt-3 h-8 w-8 text-gold md:mt-4" strokeWidth={1.5} />
                </div>
                <div>
                  <SectionLabel>Step {i + 1}</SectionLabel>
                  <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">{s.title}</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                    {s.detail.map((d) => (
                      <li
                        key={d}
                        className="border border-gold/15 bg-deluxe-black/40 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground/80"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-16 border border-gold/30 bg-gold-gradient/10 p-10 text-center">
            <GoldDivider />
            <h3 className="mt-6 font-display text-3xl text-foreground sm:text-4xl">Ready to begin?</h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Your first transformation cycle starts the moment you sign up.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <GoldButton>
                  Start your journey <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </Link>
              <Link to="/pricing">
                <OutlineButton>See pricing</OutlineButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

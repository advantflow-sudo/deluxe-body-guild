import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Crown, Flame, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/transformations")({
  head: () => ({
    meta: [
      { title: "Founding Members — Deluxe Fitness Transformations" },
      { name: "description", content: "The first 100 members to complete a 90-day Deluxe transformation will be featured here. Apply for a founding spot." },
      { property: "og:title", content: "Founding Members Transformations" },
      { property: "og:description", content: "Become one of the first 100. Your transformation, featured." },
      { property: "og:url", content: "https://deluxefitness.app/transformations" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/transformations" }],
  }),
  component: TransformationsPage,
});

const FOCUSES = [
  { focus: "Fat Loss", body: "Sustainable body recomposition, not crash dieting." },
  { focus: "Muscle Gain", body: "Hypertrophy programming + macros that work." },
  { focus: "Confidence", body: "Mindset, posture, presence — the visible kind." },
  { focus: "Lifestyle", body: "Habits, sleep, energy. Show up better at everything." },
  { focus: "Endurance", body: "From first 1k to first half-marathon." },
  { focus: "Strength", body: "Big three lifts. PR after PR. Real numbers." },
  { focus: "Reset", body: "Coming back from injury, burnout or a long gap." },
  { focus: "Discipline", body: "75 days. No excuses. The Deluxe way." },
];

const PROMISES = [
  "Featured spot on the public transformations page",
  "Founding-member badge on your profile, for life",
  "1:1 quarterly review call with a senior coach",
  "Locked-in founding-member pricing — forever",
  "Direct line into the product roadmap",
];

function TransformationsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Founding Members"
        title="Your story,"
        highlight="featured here."
        body="We're selecting the first 100 to commit to a 90-day Deluxe transformation. These cards become real members soon."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FOCUSES.map((s, i) => (
              <article
                key={s.focus}
                className="group relative aspect-[3/4] overflow-hidden border border-gold/25 bg-gradient-to-br from-deluxe-card to-deluxe-black p-6 transition hover:border-gold/60"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <Lock className="h-4 w-4 text-gold/60" strokeWidth={1.5} />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold/80">
                      Slot {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Focus</div>
                    <h2 className="mt-1 font-display text-2xl text-foreground">{s.focus}</h2>
                    <p className="mt-2 text-xs text-muted-foreground">{s.body}</p>
                    <div className="mt-4 h-px w-12 bg-gold/40" />
                    <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                      Reserved
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <SectionLabel>What you get as a founder</SectionLabel>
            <h2 className="mx-auto mt-4 font-display text-3xl sm:text-4xl">
              The first 100 get <span className="text-gold-gradient italic font-serif">more than features.</span>
            </h2>
            <div className="mt-6 flex justify-center"><GoldDivider /></div>
          </div>
          <ul className="mt-12 space-y-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 border border-gold/20 bg-deluxe-card p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span className="text-base text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-deluxe-black py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Crown className="mx-auto h-8 w-8 text-gold" strokeWidth={1.5} />
          <h2 className="mt-6 font-display text-3xl sm:text-4xl md:text-5xl">
            Claim your <span className="text-gold-gradient italic font-serif">founding spot.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Spots are filling weekly. Once the 100 founding transformations are locked in, this door closes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login"><GoldButton>Apply now <ArrowRight className="h-4 w-4" /></GoldButton></Link>
            <Link to="/pricing"><OutlineButton>See membership</OutlineButton></Link>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold">
            <Flame className="h-3 w-3" /> Founding cohort closing soon
          </p>
        </div>
      </section>
    </PageShell>
  );
}

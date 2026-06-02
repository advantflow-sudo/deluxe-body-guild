import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Calendar, Trophy, Target, ArrowRight } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — Deluxe Fitness" },
      { name: "description", content: "From 7-Day Reset to 75-Day Discipline — seasonal challenges that turn discipline into transformation." },
      { property: "og:title", content: "Deluxe Fitness Challenges" },
      { property: "og:description", content: "7, 30, 75 days. Pick your battle." },
      { property: "og:url", content: "https://deluxefitness.app/challenges" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/challenges" }],
  }),
  component: ChallengesPage,
});

const CHALLENGES = [
  { Icon: Flame, name: "7-Day Reset", duration: "7 days", reward: 250, body: "Sleep, hydration, daily movement. A clean reboot for body and mind.", level: "Starter" },
  { Icon: Target, name: "30-Day Fat Loss", duration: "30 days", reward: 500, body: "Caloric structure, daily training, weekly check-ins. Sustainable cut.", level: "All levels" },
  { Icon: Trophy, name: "75-Day Discipline", duration: "75 days", reward: 1500, body: "Two workouts a day. No alcohol. Daily reading. The hard version.", level: "Advanced" },
  { Icon: Calendar, name: "Summer Shred", duration: "8 weeks", reward: 800, body: "Periodized fat loss + conditioning timed for summer.", level: "Intermediate" },
  { Icon: Flame, name: "Strength Builder", duration: "12 weeks", reward: 1000, body: "Big-three progression: squat, bench, deadlift. Real numbers.", level: "Intermediate" },
  { Icon: Trophy, name: "Mind Mastery", duration: "30 days", reward: 400, body: "Daily mindset prompts, journaling, breathwork, meditation.", level: "All levels" },
];

function ChallengesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Challenge Hub"
        title="Pick your"
        highlight="battle."
        body="Challenges are how Deluxe members compound discipline into transformation. Pick one. Commit. Earn the badge."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.map(({ Icon, name, duration, reward, body, level }) => (
              <article key={name} className="luxury-card relative p-7 transition hover:border-gold/50">
                <span className="absolute right-5 top-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{level}</span>
                <Icon className="h-8 w-8 text-gold" strokeWidth={1.5} />
                <h2 className="mt-5 font-display text-2xl text-foreground">{name}</h2>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {duration} · +{reward} pts
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:underline">
                  Enter challenge <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionLabel>Why challenges work</SectionLabel>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            A deadline plus a tribe equals <span className="text-gold-gradient italic font-serif">transformation.</span>
          </h2>
          <div className="mt-6 flex justify-center"><GoldDivider /></div>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Every challenge ships with a private cohort feed, accountability check-ins, and a leaderboard.
            You're never doing it alone.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login"><GoldButton>Join a challenge <ArrowRight className="h-4 w-4" /></GoldButton></Link>
            <Link to="/pricing"><OutlineButton>See membership</OutlineButton></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

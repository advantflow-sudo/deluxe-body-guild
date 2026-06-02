import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Heart, Users, ArrowRight, Quote } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder Story — Deluxe Fitness" },
      { name: "description", content: "The story behind Deluxe Fitness. Built on discipline, self-improvement and the belief that fitness is the foundation for a better life." },
      { property: "og:title", content: "Why Deluxe Fitness Exists" },
      { property: "og:description", content: "The founder story behind a luxury self-improvement movement." },
      { property: "og:url", content: "https://deluxefitness.app/founder" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/founder" }],
  }),
  component: FounderPage,
});

const PILLARS = [
  { Icon: Flame, title: "Discipline", body: "Showing up is the only edge that actually compounds." },
  { Icon: Heart, title: "Self-Improvement", body: "Body, mind, mindset — they're not separate projects." },
  { Icon: Users, title: "Community", body: "Standards are contagious. So is mediocrity. Pick your room." },
];

function FounderPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Founder Story"
        title="Why Deluxe Fitness"
        highlight="exists."
        body="Built for the people who knew there was more in them — and refused to settle for another generic fitness app."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-6 font-serif text-lg leading-relaxed text-foreground/85 md:text-xl">
            <p>
              Deluxe Fitness didn't start in a gym. It started in a quiet
              frustration — the feeling that everything on the App Store treated
              fitness like a transaction. Log a workout. Count a calorie. Buy a
              subscription. Repeat.
            </p>
            <p>
              That's not what fitness is. Fitness is the
              <span className="text-gold-gradient font-display italic"> first domino </span>
              that knocks down the rest. When your body works, your mind works.
              When your discipline holds in the gym, it holds in your career, in
              your relationships, in the way you carry yourself through a room.
            </p>
            <p>
              I wanted to build something that respected that. Not another
              tracker. A platform that treats every member like an athlete in
              their own life — with the standards, community, and tools to
              match. A place where discipline is the currency and
              transformation is the contract.
            </p>
            <p>
              Deluxe Fitness is that platform. Workouts and nutrition are the
              entry point. Mindset, community and lifestyle are the reason you
              stay.
            </p>
            <p className="text-foreground">
              If you're reading this, you're probably the kind of person we
              built it for. Welcome to the movement.
            </p>
          </div>

          <figure className="mt-14 border border-gold/30 bg-deluxe-card p-8 sm:p-10">
            <Quote className="h-8 w-8 text-gold" strokeWidth={1.5} />
            <blockquote className="mt-5 font-display text-2xl leading-snug text-foreground sm:text-3xl">
              "We're not building a fitness app. We're building the operating
              system for the deluxe version of you."
            </blockquote>
            <figcaption className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              The Deluxe Founders
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <SectionLabel>What we stand on</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              Three pillars. <span className="text-gold-gradient italic font-serif">Non-negotiable.</span>
            </h2>
            <div className="mt-6 flex justify-center"><GoldDivider /></div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ Icon, title, body }) => (
              <div key={title} className="luxury-card p-8">
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
                <h3 className="mt-5 font-display text-2xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deluxe-black py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">
            Become part of the <span className="text-gold-gradient italic font-serif">story.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            The founding cohort is being selected now. Your transformation could be the one we feature next.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/transformations"><GoldButton>Apply as a founder <ArrowRight className="h-4 w-4" /></GoldButton></Link>
            <Link to="/about"><OutlineButton>Read our philosophy</OutlineButton></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

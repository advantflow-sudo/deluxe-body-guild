import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Quote } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder Story — Deluxe Fitness" },
      { name: "description", content: "The vision behind Deluxe Fitness — a movement built on discipline, identity, and the belief that most people are capable of far more than they're currently living." },
      { property: "og:title", content: "The Vision Behind Deluxe" },
      { property: "og:description", content: "The founder story behind a luxury self-improvement movement." },
      { property: "og:url", content: "https://deluxefitness.app/founder" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/founder" }],
  }),
  component: FounderPage,
});


function FounderPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Founder Story"
        title="THE VISION BEHIND"
        highlight="DELUXE."
        body="Built for the people who knew there was more in them — and refused to settle for another generic fitness app."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-6 font-serif text-lg leading-relaxed text-foreground/85 md:text-xl">
            <p>
              Deluxe Fitness was built from a simple belief — that most people
              are capable of far more than they're currently living. Not just
              physically, but mentally, socially, and in every area of their
              lives. The problem isn't motivation. It's the absence of the
              right environment, the right system, and the right standard.
            </p>
            <p>
              I built Deluxe because I wanted a platform that treated people
              like the
              <span className="text-gold-gradient font-display italic"> high performers </span>
              they could become — not where they currently are. One that
              rewards discipline, builds identity, and creates a community of
              people who genuinely push each other forward.
            </p>
            <p className="text-foreground">
              This isn't just an app. It's a movement. And it's only just
              getting started.
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
            <SectionLabel>The Mission</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              A movement, <span className="text-gold-gradient italic font-serif">not a product.</span>
            </h2>
            <div className="mt-6 flex justify-center"><GoldDivider /></div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="luxury-card p-8 text-center">
              <div className="font-display text-4xl text-gold-gradient">50,000+</div>
              <div className="mt-3 text-sm uppercase tracking-[0.22em] text-foreground">Members Worldwide</div>
            </div>
            <div className="luxury-card p-8 text-center">
              <div className="font-display text-2xl text-foreground">Built in the UK</div>
              <div className="mt-3 text-sm uppercase tracking-[0.22em] text-gold">Growing Globally</div>
            </div>
            <div className="luxury-card p-8 text-center">
              <div className="font-display text-2xl text-foreground">Zero compromises</div>
              <div className="mt-3 text-sm uppercase tracking-[0.22em] text-gold">On quality</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-deluxe-black py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionLabel>What's Next</SectionLabel>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            See where we're <span className="text-gold-gradient italic font-serif">heading.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            The founding cohort is being selected now. The roadmap is public — every milestone, every release.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/roadmap"><GoldButton>View the roadmap <ArrowRight className="h-4 w-4" /></GoldButton></Link>
            <Link to="/transformations"><OutlineButton>Apply as a founder</OutlineButton></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

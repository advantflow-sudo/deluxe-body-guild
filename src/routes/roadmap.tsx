import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Sparkles, ArrowRight } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Deluxe Fitness" },
      { name: "description", content: "What's live now and what's coming next at Deluxe Fitness. Wearables, advanced AI Coach, local events, Deluxe Black and the rewards marketplace." },
      { property: "og:title", content: "Deluxe Fitness Roadmap" },
      { property: "og:description", content: "See where the platform is going next." },
      { property: "og:url", content: "https://deluxefitness.app/roadmap" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/roadmap" }],
  }),
  component: RoadmapPage,
});

const LIVE = [
  "Personalized workouts library",
  "Daily tracking & Deluxe Score",
  "Members-only community feed",
  "AI Coach (chat)",
  "Accountability partner matching",
  "Streak system + weekly freezes",
  "Apple Health & Google Fit sync",
];

const SOON = [
  { q: "Q3 2026", title: "Wearable Integrations", body: "Whoop, Garmin, Oura — full ring-style integration." },
  { q: "Q3 2026", title: "Advanced AI Coach", body: "Plateau detection, voice mode, form-check video analysis." },
  { q: "Q4 2026", title: "Local Events & Meet-ups", body: "City-by-city Deluxe gatherings, training days, dinners." },
  { q: "Q4 2026", title: "Deluxe Black Membership", body: "Invitation-only tier. Concierge coach. Annual retreat." },
  { q: "Q1 2027", title: "Rewards Marketplace", body: "Full redemption store: gear, supplements, experiences." },
  { q: "Q2 2027", title: "Native Nutrition Engine", body: "AI meal planning with grocery list export." },
];

function RoadmapPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Product Roadmap"
        title="Where Deluxe"
        highlight="is going."
        body="We build in public. Here's what's already shipped — and exactly what's coming next."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Live Now */}
            <div>
              <SectionLabel>Live Now</SectionLabel>
              <h2 className="mt-4 font-display text-3xl text-foreground">In your hands today.</h2>
              <div className="mt-6"><GoldDivider /></div>
              <ul className="mt-8 space-y-3">
                {LIVE.map((l) => (
                  <li key={l} className="flex items-start gap-3 border border-gold/20 bg-deluxe-card p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <span className="text-sm text-foreground/90">{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coming Soon */}
            <div>
              <SectionLabel>Coming Soon</SectionLabel>
              <h2 className="mt-4 font-display text-3xl text-foreground">Shipping next.</h2>
              <div className="mt-6"><GoldDivider /></div>
              <ol className="mt-8 space-y-3">
                {SOON.map((s) => (
                  <li key={s.title} className="border border-gold/20 bg-gradient-to-br from-deluxe-card to-deluxe-black p-5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gold" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{s.q}</span>
                    </div>
                    <div className="mt-2 font-display text-xl text-foreground">{s.title}</div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-16 border border-gold/30 bg-gold-gradient/10 p-10 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-gold" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-2xl sm:text-3xl">Shape what we build next.</h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Founding members get a direct line into the roadmap. Your feature requests, prioritized.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/transformations"><GoldButton>Become a founder <ArrowRight className="h-4 w-4" /></GoldButton></Link>
              <Link to="/contact"><OutlineButton>Suggest a feature</OutlineButton></Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

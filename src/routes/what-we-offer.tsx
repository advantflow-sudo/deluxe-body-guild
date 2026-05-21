import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Dumbbell,
  Brain,
  Users,
  Heart,
  Sparkles,
  Apple,
  Trophy,
} from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton } from "@/components/deluxe/ui";

export const Route = createFileRoute("/what-we-offer")({
  head: () => ({
    meta: [
      { title: "What We Offer — Deluxe Fitness" },
      {
        name: "description",
        content:
          "Premium workouts, AI coaching, nutrition, wellbeing and community — everything Deluxe Fitness gives you, in one place.",
      },
      { property: "og:title", content: "What We Offer — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Workouts, AI coach, nutrition, wellbeing, community, rewards. Built for those who demand more.",
      },
    ],
  }),
  component: Page,
});

const services = [
  {
    Icon: Dumbbell,
    title: "Fitness & Workouts",
    body: "Strength, HIIT, mobility, calisthenics. Gym, home and outdoor programmes for every level.",
  },
  {
    Icon: Brain,
    title: "AI Coach",
    body: "24/7 personalised guidance, form tips and discipline-led motivation tuned to your goals.",
  },
  {
    Icon: Apple,
    title: "Nutrition",
    body: "Track calories and macros, plan meals, stay hydrated — without the guesswork.",
  },
  {
    Icon: Heart,
    title: "Wellbeing & Education",
    body: "Yoga, pilates, mobility, recovery and mindset content built by certified professionals.",
  },
  {
    Icon: Users,
    title: "Community",
    body: "An invite-only feed of athletes pushing each other. Find partners, share progress, stay accountable.",
  },
  {
    Icon: Trophy,
    title: "Rewards & Booking",
    body: "Earn streaks, badges and partner perks. Book classes, sessions and PTs straight from the app.",
  },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="What we offer"
        title="EVERY TOOL YOU NEED TO"
        highlight="BECOME DELUXE."
        body="Six pillars. One platform. Built around the rhythm of a high-performing life — from your first warm-up to your hardest set."
      />
      <section className="bg-deluxe-black py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="luxury-card group relative overflow-hidden p-8 transition hover:border-gold/40"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gold" />
              <Icon className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-2xl tracking-wide text-foreground">
                {title.toUpperCase()}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center sm:flex-row">
          <Link to="/login">
            <GoldButton>
              <Sparkles className="h-4 w-4" /> Start Your Journey
            </GoldButton>
          </Link>
          <Link to="/pricing">
            <OutlineButton>See Pricing</OutlineButton>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

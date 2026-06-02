import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Dumbbell, Activity, Timer, Flame, Target } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton } from "@/components/deluxe/ui";
import workout1 from "@/assets/workout-1.jpg";
import workout2 from "@/assets/workout-2.jpg";
import workout3 from "@/assets/workout-3.jpg";

export const Route = createFileRoute("/fitness")({
  head: () => ({
    meta: [
      { title: "Fitness & Workouts — Deluxe Fitness" },
      {
        name: "description",
        content:
          "AI-personalised workouts, full body breakdown, strength, HIIT and mobility programmes for every level.",
      },
      { property: "og:title", content: "Fitness & Workouts — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "AI-personalised workouts and full body breakdown. Train smarter at every level.",
      },
    ],
  }),
  component: Page,
});

const programmes = [
  {
    img: workout1,
    title: "Strength Foundations",
    meta: "12 weeks · Beginner → Intermediate",
    body: "Progressive overload with compound lifts. Build the engine that everything else stacks on.",
  },
  {
    img: workout2,
    title: "HIIT & Conditioning",
    meta: "8 weeks · All levels",
    body: "Short, brutal, effective. Burn fat and build a heart that doesn't quit.",
  },
  {
    img: workout3,
    title: "Hybrid Athlete",
    meta: "16 weeks · Advanced",
    body: "Strength, endurance and skill in one programme. Built for people who want it all.",
  },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Fitness & Workouts"
        title="TRAIN WITH"
        highlight="INTENT."
        body="AI-personalised programmes and a full body breakdown so every session moves you forward — never just keeps you busy."
      />

      {/* AI fitness highlight */}
      <section className="bg-deluxe-dark py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <span className="eyebrow">AI Fitness</span>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              YOUR COACH NEVER <span className="text-gold">CLOCKS OFF.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Tell the AI Coach your goal, level and equipment. It builds a
              programme, adapts it weekly based on your sessions, and gives you
              form notes, recovery cues and motivation when you need it.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foreground/90">
              {[
                ["Brain", "Personalised programming, every week"],
                ["Target", "Form, technique and recovery guidance"],
                ["Flame", "Adapts to your streak, energy and goals"],
              ].map(([_, line], i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link to="/coach">
                <GoldButton>
                  <Brain className="h-4 w-4" /> Try the AI Coach
                </GoldButton>
              </Link>
            </div>
          </div>
          <div className="luxury-card aspect-[4/5] overflow-hidden">
            <img
              src={workout2}
              alt="AI-driven training"
              loading="lazy"
              className="h-full w-full object-cover ken-burns"
            />
          </div>
        </div>
      </section>

      {/* Body breakdown */}
      <section className="bg-deluxe-black py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="eyebrow">Break Down the Body</span>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              EVERY MUSCLE. <span className="text-gold">EVERY MOVEMENT.</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { Icon: Dumbbell, t: "Strength", s: "Push, pull, hinge, squat" },
              {
                Icon: Activity,
                t: "Conditioning",
                s: "Aerobic, anaerobic, hybrid",
              },
              {
                Icon: Timer,
                t: "Mobility",
                s: "Recovery, flexibility, longevity",
              },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="luxury-card p-8 text-center">
                <Icon
                  className="mx-auto h-7 w-7 text-gold"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 font-display text-2xl tracking-wide">
                  {t.toUpperCase()}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="bg-deluxe-dark py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="eyebrow">Featured Programmes</span>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
              BUILT FOR <span className="text-gold">EVERY STAGE.</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {programmes.map((p) => (
              <article
                key={p.title}
                className="luxury-card group overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                    {p.meta}
                  </div>
                  <h3 className="mt-3 font-display text-2xl tracking-wide">
                    {p.title.toUpperCase()}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

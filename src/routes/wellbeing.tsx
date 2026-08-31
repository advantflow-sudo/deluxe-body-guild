import { createFileRoute } from "@tanstack/react-router";
import { Heart, Leaf, Brain, Moon, Wind, BookOpen } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import ogImage from "@/assets/og-deluxe-gold.jpg.asset.json";

export const Route = createFileRoute("/wellbeing")({
  head: () => ({
    meta: [
      { title: "Wellbeing & Education — Deluxe Fitness" },
      {
        name: "description",
        content:
          "Recovery check-ins, sleep logging, mobility routines and mindset prompts — with filmed classes on the roadmap.",
      },
      { property: "og:title", content: "Wellbeing & Education — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Recovery, sleep and mindset tools that are live today, plus what is coming next.",
      },
      { property: "og:url", content: "https://deluxefitness.app/wellbeing" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: `https://deluxefitness.app${ogImage.url}` },
      { name: "twitter:image", content: `https://deluxefitness.app${ogImage.url}` },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/wellbeing" }],
  }),
  component: Page,
});

const pillars = [
  {
    Icon: Leaf,
    title: "Yoga & Pilates",
    body: "Written mobility and flow routines you can follow session by session. Filmed classes are on the roadmap.",
  },
  {
    Icon: Wind,
    title: "Breathwork",
    body: "Written box-breathing and performance protocols. Guided audio sessions are on the roadmap.",
  },
  {
    Icon: Moon,
    title: "Sleep & Recovery",
    body: "Wind-down routines, recovery sessions and tracking to make sure you actually rest.",
  },
  {
    Icon: Brain,
    title: "Mindset",
    body: "Discipline, focus and resilience drills. Build the mental engine to match the physical one.",
  },
  {
    Icon: Heart,
    title: "Zumba & Movement",
    body: "Dance-led movement ideas written as follow-along routines. Filmed classes are on the roadmap.",
  },
  {
    Icon: BookOpen,
    title: "Education",
    body: "Written guides and protocols from the Deluxe team. Contributions from external practitioners are on the roadmap.",
  },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Wellbeing & Education"
        title="STRONG BODY."
        highlight="CALM MIND."
        body="Fitness without recovery isn't elite — it's burnout. Recovery check-ins, sleep logging and mindset prompts are live today."
      />
      <section className="bg-deluxe-black py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ Icon, title, body }) => (
            <div key={title} className="luxury-card p-8">
              <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
              <h2 className="mt-5 font-display text-2xl tracking-wide">
                {title.toUpperCase()}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

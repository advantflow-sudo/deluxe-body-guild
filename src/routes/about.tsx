import { createFileRoute } from "@tanstack/react-router";
import { Compass, Flag, Users } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { AnimatedMedia } from "@/components/deluxe/AnimatedMedia";
import { MEDIA } from "@/config/animated-media";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Deluxe Fitness" },
      {
        name: "description",
        content:
          "The story behind Deluxe Fitness — where we came from, where we are, where we're going, and the community we're building.",
      },
      { property: "og:title", content: "About Us — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Our history, where we are, where we're going, and the Deluxe community.",
      },
    ],
  }),
  component: Page,
});

const chapters = [
  {
    Icon: Compass,
    label: "Our History",
    title: "BUILT FROM THE FLOOR UP.",
    body: "Deluxe Fitness started in a single gym, with a small group of athletes obsessed with one idea: that fitness shouldn't be a chore, it should be a lifestyle. Every feature in this app comes from real conversations on real gym floors.",
  },
  {
    Icon: Flag,
    label: "Where We Are",
    title: "A MOVEMENT, NOT AN APP.",
    body: "Today, members across the UK and beyond train, eat, recover and connect through Deluxe. We partner with gyms, coaches, and brands who share our standard — premium, unapologetic, results-led.",
  },
  {
    Icon: Users,
    label: "Where We're Going",
    title: "GLOBAL. PERSONAL. DELUXE.",
    body: "Booking integrations, native iOS & Android, AI coaching for every member, partner gym contracts worldwide. The roadmap is ambitious — because so are the people we build for.",
  },
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About Us"
        title="WE'RE NOT BUILDING AN APP."
        highlight="WE'RE BUILDING A STANDARD."
        body="Our story is about discipline, transformation, and the people who refuse to settle."
      />

      <section className="relative overflow-hidden bg-deluxe-dark py-24">
        <AnimatedMedia
          id="about-community-bg"
          image={MEDIA.community.image}
          video={MEDIA.community.video}
          alt={MEDIA.community.alt}
          caption={MEDIA.community.caption}
          variant="in"
          className="absolute inset-0 h-full w-full opacity-15"
          mediaClassName="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deluxe-dark via-deluxe-dark/85 to-deluxe-dark" />
        <div className="relative mx-auto max-w-5xl space-y-16 px-6">
          {chapters.map(({ Icon, label, title, body }, i) => (
            <article
              key={label}
              className="grid items-start gap-8 md:grid-cols-[200px_1fr]"
            >
              <div>
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                  Chapter {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </div>
              </div>
              <div className="border-l border-gold/20 pl-8">
                <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl">
                  {title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

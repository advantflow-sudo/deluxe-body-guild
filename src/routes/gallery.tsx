import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ArrowRight } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { AnimatedMedia } from "@/components/deluxe/AnimatedMedia";
import { GoldButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";
import { MEDIA, type MediaKey } from "@/config/animated-media";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Deluxe Fitness" },
      { name: "description", content: "The Deluxe Gallery — real training, real people, real results from inside the Deluxe Fitness movement." },
      { property: "og:title", content: "The Deluxe Gallery" },
      { property: "og:description", content: "Real training. Real people. Real results." },
      { property: "og:url", content: "https://deluxefitness.app/gallery" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/gallery" }],
  }),
  component: Page,
});

const items: Array<{ key: MediaKey; span?: string; variant?: "in" | "alt" | "zoom" }> = [
  { key: "hero", span: "md:col-span-2 md:row-span-2", variant: "in" },
  { key: "workout1", variant: "alt" },
  { key: "workout2", variant: "in" },
  { key: "community", span: "md:col-span-2", variant: "alt" },
  { key: "workout3", variant: "zoom" },
];

const LOCKED_TILES = [
  "Founding cohort · transformations",
  "Spring training camp",
  "Members-only retreat",
];

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Gallery"
        title="THE DELUXE"
        highlight="GALLERY."
        body="Real training. Real people. Real results."
      />
      <section className="bg-deluxe-black py-20">
        <div className="mx-auto grid max-w-7xl auto-rows-[240px] grid-cols-1 gap-3 px-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map(({ key, span, variant }, i) => {
            const m = MEDIA[key];
            return (
              <div
                key={`${key}-${i}`}
                className={`group relative overflow-hidden border border-gold/15 ${span ?? ""}`}
              >
                <AnimatedMedia
                  id={`gallery-${key}-${i}`}
                  image={m.image}
                  video={m.video}
                  alt={m.alt}
                  caption={m.caption}
                  variant={variant}
                  priority={i === 0}
                  className="h-full w-full"
                  mediaClassName="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deluxe-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
            );
          })}

          {LOCKED_TILES.map((label, i) => (
            <div
              key={`locked-${i}`}
              className="group relative flex flex-col items-center justify-center overflow-hidden border border-gold/20 bg-gradient-to-br from-deluxe-card via-deluxe-black to-deluxe-dark p-6 text-center"
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold/10 to-transparent transition-transform duration-[1800ms] group-hover:translate-x-full" />
              <div className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/5">
                <Lock className="h-4 w-4 text-gold" strokeWidth={1.5} />
              </div>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                Coming soon
              </div>
              <div className="mt-2 max-w-[18ch] font-display text-sm leading-snug text-foreground/80">
                {label}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Founding members only
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionLabel>Submit your story</SectionLabel>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Are you a <span className="text-gold-gradient italic font-serif">founding member?</span>
          </h2>
          <div className="mt-6 flex justify-center"><GoldDivider /></div>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Submit your transformation photos to be featured in the Deluxe Gallery.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/contact">
              <GoldButton>Submit your transformation <ArrowRight className="h-4 w-4" /></GoldButton>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}


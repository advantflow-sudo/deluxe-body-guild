import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { AnimatedMedia } from "@/components/deluxe/AnimatedMedia";
import { MEDIA, type MediaKey } from "@/config/animated-media";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Deluxe Fitness" },
      {
        name: "description",
        content:
          "Inside the Deluxe Fitness world — moments from training floors, member stories and the culture we're building.",
      },
      { property: "og:title", content: "Gallery — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Inside the Deluxe Fitness world. Training, culture, members.",
      },
    ],
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

function Page() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Gallery"
        title="INSIDE"
        highlight="DELUXE."
        body="The training floors. The members. The grit. Real moments from the Deluxe Fitness world."
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
        </div>
      </section>
    </PageShell>
  );
}

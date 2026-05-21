import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import hero from "@/assets/hero.jpg";
import w1 from "@/assets/workout-1.jpg";
import w2 from "@/assets/workout-2.jpg";
import w3 from "@/assets/workout-3.jpg";
import community from "@/assets/community.jpg";

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

const images = [
  { src: hero, alt: "Athlete in the gym", span: "md:col-span-2 md:row-span-2" },
  { src: w1, alt: "Loaded barbell", span: "" },
  { src: w2, alt: "Battle ropes" },
  { src: community, alt: "Community floor", span: "md:col-span-2" },
  { src: w3, alt: "Kettlebells lined up" },
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
          {images.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden border border-gold/15 ${img.span ?? ""}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deluxe-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

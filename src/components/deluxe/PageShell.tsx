import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { GoldDivider, SectionLabel } from "./ui";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-deluxe-black text-foreground">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  highlight,
  body,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  body?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-gold/15 bg-deluxe-dark py-24">
      <div className="gold-glow absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl">
          {title} {highlight && <span className="text-gold">{highlight}</span>}
        </h1>
        <div className="mt-6 flex justify-center">
          <GoldDivider />
        </div>
        {body && (
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {body}
          </p>
        )}
      </div>
    </section>
  );
}

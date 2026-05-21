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
    <section className="noise relative overflow-hidden border-b border-gold/15 bg-deluxe-dark py-28">
      <div className="gold-glow absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="mt-7 font-display text-4xl font-medium leading-[1.05] sm:text-5xl md:text-6xl">
          <span className="text-foreground">{title}</span>{" "}
          {highlight && <span className="text-gold-gradient italic font-serif font-light">{highlight}</span>}
        </h1>
        <div className="mt-7 flex justify-center">
          <GoldDivider />
        </div>
        {body && (
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground md:text-xl">
            {body}
          </p>
        )}
      </div>
    </section>
  );
}

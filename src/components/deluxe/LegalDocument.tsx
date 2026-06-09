import type { ReactNode } from "react";

export function LegalDocument({
  children,
  updated,
}: {
  children: ReactNode;
  updated: string;
}) {
  return (
    <section className="bg-deluxe-black py-20">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
          Last updated · {updated}
        </p>
        <div className="mt-8 space-y-10 text-foreground/85">{children}</div>
        <p className="mt-16 border-t border-gold/15 pt-6 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          © 2026 Deluxe Fitness Ltd. · Created by{" "}
          <a
            href="https://advantflowai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold transition hover:text-gold/80"
          >
            advantflowai.com
          </a>
        </p>
      </div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

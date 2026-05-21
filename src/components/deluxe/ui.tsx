import type { ButtonHTMLAttributes, ReactNode } from "react";

export function GoldButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 bg-gold px-7 py-3.5 font-body text-xs font-bold uppercase tracking-[0.22em] text-deluxe-black transition-all hover:bg-gold-light hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.6)] active:translate-y-px ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 border border-gold/60 bg-transparent px-7 py-3.5 font-body text-xs font-bold uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold/10 hover:border-gold ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return <span className={`gold-divider ${className}`} />;
}

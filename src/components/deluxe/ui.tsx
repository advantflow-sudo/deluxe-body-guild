import type { ButtonHTMLAttributes, ReactNode } from "react";

export function GoldButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden bg-gold-gradient px-8 py-3.5 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-deluxe-black transition-all hover:shadow-[0_10px_40px_-10px_rgba(201,162,76,0.55)] active:translate-y-px ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
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
      className={`inline-flex items-center justify-center gap-2 border border-gold/50 bg-transparent px-8 py-3.5 font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-gold transition-all hover:border-gold hover:bg-gold/5 hover:shadow-[0_0_24px_-8px_rgba(201,162,76,0.5)] ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return <span id={id} className="eyebrow">{children}</span>;
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return <span className={`gold-divider ${className}`} />;
}

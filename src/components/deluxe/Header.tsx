import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { GoldButton, OutlineButton } from "./ui";
import { useAuth } from "@/hooks/useAuth";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/what-we-offer", label: "What We Offer" },
  { to: "/fitness", label: "Fitness & Workouts" },
  { to: "/wellbeing", label: "Wellbeing" },
  { to: "/coach", label: "AI Coach" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About Us" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-deluxe-black/85 backdrop-blur-xl supports-[backdrop-filter]:bg-deluxe-black/70">
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="group relative px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-foreground/55 transition-colors duration-300 hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              <span className="relative">
                {l.label}
                <span className="pointer-events-none absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-300 group-hover:w-full group-[.active]:w-full" />
              </span>
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          {session ? (
            <Link to="/app"><GoldButton>Dashboard</GoldButton></Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:text-gold"
              >
                Sign In
              </Link>
              <Link to="/login"><GoldButton>Join</GoldButton></Link>
            </>
          )}
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10 xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-gold/15 bg-deluxe-black xl:hidden">
          <nav className="flex flex-col px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-gold/10 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="space-y-3 pt-4">
              {session ? (
                <Link to="/app" onClick={() => setOpen(false)}>
                  <GoldButton className="w-full">Dashboard</GoldButton>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <OutlineButton className="w-full">Sign In</OutlineButton>
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <GoldButton className="w-full">Join</GoldButton>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

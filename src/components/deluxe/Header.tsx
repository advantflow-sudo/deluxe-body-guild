import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { GoldButton, OutlineButton } from "./ui";
import { useAuth } from "@/hooks/useAuth";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/what-we-offer", label: "What We Offer" },
  { to: "/fitness", label: "Fitness" },
  { to: "/wellbeing", label: "Wellbeing" },
  { to: "/coach", label: "AI Coach" },
  { to: "/challenges", label: "Challenges" },
  { to: "/transformations", label: "Transformations" },
  { to: "/rewards-benefits", label: "Rewards" },
  { to: "/pricing", label: "Pricing" },
  { to: "/founder", label: "Founder" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

const PRIMARY_LABELS = ["Home", "How It Works", "Fitness", "Wellbeing", "Pricing"];
export const PRIMARY_NAV = NAV_LINKS.filter((l) => PRIMARY_LABELS.includes(l.label));
export const SECONDARY_NAV = NAV_LINKS.filter((l) => !PRIMARY_LABELS.includes(l.label));

export function Header() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-deluxe-black/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-deluxe-black/70">
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:gap-6 sm:py-4">

        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 lg:flex">
          {PRIMARY_NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="group relative whitespace-nowrap px-2 py-2 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-foreground/55 transition-colors duration-300 hover:text-gold xl:px-3 xl:text-[10.5px] xl:tracking-[0.26em]"
              activeProps={{ className: "text-gold" }}
            >
              <span className="relative">
                {l.label}
                <span className="pointer-events-none absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-300 group-hover:w-full group-[.active]:w-full" />
              </span>
            </Link>
          ))}
          <div className="relative" onMouseLeave={() => setMoreOpen(false)}>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((v) => !v)}
              onMouseEnter={() => setMoreOpen(true)}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-2 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-foreground/55 transition-colors hover:text-gold xl:px-3 xl:text-[10.5px] xl:tracking-[0.26em]"
            >
              More
              <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-gold/25 bg-deluxe-black/95 py-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                {SECONDARY_NAV.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/65 transition-colors hover:bg-gold/5 hover:text-gold"
                    activeProps={{ className: "text-gold" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {session ? (
            <Link to="/app"><GoldButton>Dashboard</GoldButton></Link>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-gold"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-gold/15 bg-deluxe-black lg:hidden">
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

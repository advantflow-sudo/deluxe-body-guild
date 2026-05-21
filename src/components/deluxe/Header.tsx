import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { GoldButton } from "./ui";

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/what-we-offer", label: "What We Offer" },
  { to: "/fitness", label: "Fitness & Workouts" },
  { to: "/wellbeing", label: "Wellbeing" },
  { to: "/about", label: "About Us" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-deluxe-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <GoldButton>Book Now</GoldButton>
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="text-gold lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                className="border-b border-gold/10 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                activeProps={{ className: "text-gold" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-4">
              <GoldButton className="w-full">Book Now</GoldButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

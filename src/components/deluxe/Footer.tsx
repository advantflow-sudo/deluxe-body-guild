import { Link } from "@tanstack/react-router";
import { Instagram, Play, Sparkles, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./Header";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-deluxe-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Premium fitness, wellbeing and community. Built for those who
              demand more from themselves — every single day.
            </p>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <a
                href="#"
                aria-label="Instagram"
                className="transition hover:text-gold"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="TikTok"
                className="transition hover:text-gold"
              >
                <Play className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="X"
                className="transition hover:text-gold"
              >
                <Sparkles className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="eyebrow">Explore</h4>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition hover:text-gold"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/app"
                  className="text-sm font-medium text-gold transition hover:text-gold/80"
                >
                  Dashboard →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow">Get in touch</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-gold" />
                <span>hello@deluxefitness.app</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" />
                <span>London · UK</span>
              </li>
            </ul>
            <h4 className="eyebrow mt-8">Legal</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition hover:text-gold">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-gold">
                  Company Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-gold">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-gold/10 pt-6 md:flex-row md:items-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            © 2026 Deluxe Fitness. All rights reserved.
          </p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold/70">
            Discipline. Transform. Become Deluxe.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Facebook, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./Header";
import { ReduceMotionToggle } from "./ReduceMotionToggle";

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
                href="https://www.instagram.com/deluxefitness"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition hover:text-gold"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@deluxefitness"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="transition hover:text-gold"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M16.6 5.82a4.28 4.28 0 0 1-3.77-4.04h-3.2v13.5a2.59 2.59 0 1 1-2.59-2.59c.28 0 .56.05.82.13v-3.27a5.8 5.8 0 0 0-.82-.06A5.86 5.86 0 1 0 12.83 15.3V8.66a7.49 7.49 0 0 0 4.36 1.4V6.87a4.31 4.31 0 0 1-.59-.05z"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@deluxefitness"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="transition hover:text-gold"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/deluxefitness"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition hover:text-gold"
              >
                <Facebook className="h-4 w-4" />
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
          <div className="flex flex-wrap items-center gap-4">
            <ReduceMotionToggle />
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold/70">
              Discipline. Transform. Become Deluxe.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

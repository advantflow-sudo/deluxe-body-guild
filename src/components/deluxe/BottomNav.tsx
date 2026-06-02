import { Link } from "@tanstack/react-router";
import { Home, Dumbbell, Target, TrendingUp, Wand2, User } from "lucide-react";

const items = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/workouts", label: "Train", icon: Dumbbell, exact: false },
  { to: "/app/habits", label: "Habits", icon: Target, exact: false },
  { to: "/app/ai", label: "AI", icon: Wand2, exact: false },
  { to: "/app/progress", label: "Stats", icon: TrendingUp, exact: false },
  { to: "/app/profile", label: "Me", icon: User, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/20 bg-deluxe-black/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-0.5 py-1.5 sm:px-1 sm:py-2">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: i.exact ?? false }}
            className="group flex flex-1 flex-col items-center gap-0.5 rounded px-0.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-foreground/50 transition-colors hover:text-gold sm:gap-1 sm:px-1 sm:py-2 sm:tracking-[0.18em]"
            activeProps={{ className: "text-gold" }}
          >
            <i.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

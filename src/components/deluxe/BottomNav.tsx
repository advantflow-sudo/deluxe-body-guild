import { Link } from "@tanstack/react-router";
import { Home, Dumbbell, TrendingUp, Award, User } from "lucide-react";

const items = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/workouts", label: "Workouts", icon: Dumbbell, exact: false },
  { to: "/app/progress", label: "Progress", icon: TrendingUp, exact: false },
  { to: "/app/rewards", label: "Rewards", icon: Award, exact: false },
  { to: "/app/profile", label: "Profile", icon: User, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/20 bg-deluxe-black/95 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 py-2">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            activeOptions={{ exact: i.exact ?? false }}
            className="group flex flex-1 flex-col items-center gap-1 rounded px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-foreground/50 transition-colors hover:text-gold"
            activeProps={{ className: "text-gold" }}
          >
            <i.icon className="h-5 w-5" />
            <span>{i.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

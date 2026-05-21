import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Dumbbell,
  Heart,
  Sparkles,
  Crown,
  Users,
  Image as ImageIcon,
  Mail,
  Info,
  LayoutDashboard,
  LogIn,
  Search,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/what-we-offer", label: "What We Offer", Icon: Sparkles },
  { to: "/fitness", label: "Fitness & Workouts", Icon: Dumbbell },
  { to: "/wellbeing", label: "Wellbeing", Icon: Heart },
  { to: "/coach", label: "AI Coach", Icon: Sparkles },
  { to: "/pricing", label: "Pricing", Icon: Crown },
  { to: "/about", label: "About Us", Icon: Info },
  { to: "/gallery", label: "Gallery", Icon: ImageIcon },
  { to: "/contact", label: "Contact", Icon: Mail },
] as const;

const ACTIONS = [
  { to: "/dashboard", label: "Open Dashboard", Icon: LayoutDashboard },
  { to: "/login", label: "Sign in / Join", Icon: LogIn },
  { to: "/coach", label: "Ask the AI Coach", Icon: Sparkles },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="fixed bottom-6 right-6 z-40 hidden h-12 items-center gap-2 rounded-full border border-gold/40 bg-deluxe-black/80 px-5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold shadow-[0_10px_40px_-10px_rgba(201,162,76,0.45)] backdrop-blur-xl transition hover:border-gold hover:bg-deluxe-dark md:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <span className="ml-1 rounded border border-gold/30 px-1.5 py-0.5 text-[9px] tracking-widest text-gold/70">
          ⌘K
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a page, action, or feeling…" />
        <CommandList>
          <CommandEmpty>Nothing matches. Try another word.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {NAV.map(({ to, label, Icon }) => (
              <CommandItem key={to} value={label} onSelect={() => go(to)}>
                <Icon className="mr-2 h-4 w-4 text-gold" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            {ACTIONS.map(({ to, label, Icon }) => (
              <CommandItem key={label} value={label} onSelect={() => go(to)}>
                <Icon className="mr-2 h-4 w-4 text-gold" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

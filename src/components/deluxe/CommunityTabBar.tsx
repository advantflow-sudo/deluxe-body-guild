import { Link } from "@tanstack/react-router";
import { haptic } from "@/hooks/useHaptics";

export type CommunityTab = "feed" | "following";

const base =
  "shrink-0 whitespace-nowrap border-b-2 px-3 pb-2 pt-1 font-body text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors";

export function CommunityTabBar({
  active,
  onSelect,
}: {
  active: CommunityTab;
  onSelect: (tab: CommunityTab) => void;
}) {
  return (
    <nav
      aria-label="Community sections"
      className="mt-5 flex items-center gap-1 overflow-x-auto border-b border-gold/15"
    >
      {(["feed", "following"] as CommunityTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          aria-current={active === tab ? "page" : undefined}
          onClick={() => {
            haptic("selection");
            onSelect(tab);
          }}
          className={`${base} ${
            active === tab
              ? "border-gold text-gold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
      <Link
        to="/app/challenges"
        className={`${base} border-transparent text-muted-foreground hover:text-foreground`}
      >
        Challenges
      </Link>
      <Link
        to="/app/leaderboard"
        className={`${base} border-transparent text-muted-foreground hover:text-foreground`}
      >
        Leaderboard
      </Link>
    </nav>
  );
}

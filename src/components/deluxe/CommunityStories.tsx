import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { haptic } from "@/hooks/useHaptics";

export interface StoryItem {
  userId: string;
  name: string;
  avatarUrl: string | null;
  preview: string | null;
  fresh: boolean;
}

export function CommunityStories({
  items,
  onCreate,
}: {
  items: StoryItem[];
  onCreate: () => void;
}) {
  return (
    <section aria-label="Member stories" className="mt-5">
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onCreate();
          }}
          className="flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-gold/50 bg-deluxe-black/60 text-gold">
            <Plus className="h-5 w-5" />
          </span>
          <span className="truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Your story
          </span>
        </button>

        {items.map((s) => (
          <Link
            key={s.userId}
            to="/app/u/$userId"
            params={{ userId: s.userId }}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full p-[2px] ${
                s.fresh ? "bg-gold-gradient" : "bg-gold/20"
              }`}
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-deluxe-black bg-deluxe-surface">
                {s.preview || s.avatarUrl ? (
                  <img
                    src={(s.preview ?? s.avatarUrl) as string}
                    alt={`${s.name}'s latest progress`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-sm text-gold">
                    {s.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <span className="w-16 truncate text-center text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {s.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

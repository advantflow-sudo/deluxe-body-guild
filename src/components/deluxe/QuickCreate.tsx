import { Dumbbell, UtensilsCrossed, Image as ImageIcon, MessageSquareQuote } from "lucide-react";
import { haptic } from "@/hooks/useHaptics";

export type PostType = "workout" | "meal" | "photo" | "thought";

export const POST_TYPES: {
  id: PostType;
  label: string;
  hint: string;
  placeholder: string;
  icon: typeof Dumbbell;
}[] = [
  {
    id: "workout",
    label: "Workout",
    hint: "Training summary, sets, PBs",
    placeholder: "Session, sets and any PBs you hit today…",
    icon: Dumbbell,
  },
  {
    id: "meal",
    label: "Meal",
    hint: "Macros shared only if you choose",
    placeholder: "What you ate, and why it worked for your plan…",
    icon: UtensilsCrossed,
  },
  {
    id: "photo",
    label: "Photo",
    hint: "Progress photo — privacy first",
    placeholder: "Add a caption for your progress photo…",
    icon: ImageIcon,
  },
  {
    id: "thought",
    label: "Thought",
    hint: "Mindset, wins, encouragement",
    placeholder: "Share a win, a lesson or some encouragement…",
    icon: MessageSquareQuote,
  },
];

export function QuickCreate({
  value,
  onChange,
}: {
  value: PostType;
  onChange: (type: PostType) => void;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        Choose a post type
      </div>
      <div
        role="radiogroup"
        aria-label="Post type"
        className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {POST_TYPES.map((t) => {
          const Icon = t.icon;
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                haptic("selection");
                onChange(t.id);
              }}
              className={`flex min-h-11 flex-col items-start gap-1 border p-2.5 text-left transition-colors ${
                selected
                  ? "border-gold bg-gold/10"
                  : "border-gold/15 bg-deluxe-black/40 hover:border-gold/40"
              }`}
            >
              <Icon className={`h-4 w-4 ${selected ? "text-gold" : "text-muted-foreground"}`} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                {t.label}
              </span>
              <span className="text-[9px] leading-tight text-muted-foreground">{t.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

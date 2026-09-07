import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { FEATURES } from "@/components/deluxe/AiFeaturePanels";

export const Route = createFileRoute("/_authenticated/app/ai")({
  head: () => ({
    meta: [
      { title: "AI Studio | Deluxe Fitness" },
      { name: "description", content: "Ten AI tools built on your own training, nutrition and recovery data." },
      { property: "og:title", content: "AI Studio | Deluxe Fitness" },
      { property: "og:description", content: "Ten AI tools built on your own training, nutrition and recovery data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIStudio,
});

function AIStudio() {
  const { hasTier } = usePremium();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-5">
      <SectionLabel>AI Studio</SectionLabel>
      <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
        Your <span className="text-gold-gradient italic">intelligence stack</span>
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Each tool opens on its own screen — tap one to begin.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const requiredTier = f.tier ?? "essential";
          const locked = Boolean(f.premium) && !hasTier(requiredTier);
          const label = requiredTier === "signature" ? "Signature" : "Essential";
          const inner = (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/30 bg-deluxe-forest/30">
                <f.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm text-foreground">{f.title}</span>
                  {f.premium && (
                    <span className="rounded-sm bg-gold-gradient px-1 py-0.5 text-[8px] font-bold uppercase text-deluxe-black">
                      {label}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{f.sub}</div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gold/50 group-hover:text-gold" />
            </>
          );
          const cls =
            "group flex items-start gap-3 border border-gold/15 bg-deluxe-black/40 p-3.5 text-left transition hover:border-gold/60";

          return locked ? (
            <button
              key={f.key}
              onClick={() => toast.error(`${label} membership required to unlock.`)}
              className={cls}
            >
              {inner}
            </button>
          ) : (
            <Link key={f.key} to="/app/ai/$feature" params={{ feature: f.key }} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Lock } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { FEATURES, FeaturePanel, type FeatureKey } from "@/components/deluxe/AiFeaturePanels";

export const Route = createFileRoute("/_authenticated/app/ai/$feature")({
  head: () => ({
    meta: [
      { title: "AI Tool | Deluxe Fitness" },
      { name: "description", content: "A focused AI tool built on your own training, nutrition and recovery data." },
      { property: "og:title", content: "AI Tool | Deluxe Fitness" },
      { property: "og:description", content: "A focused AI tool built on your own training, nutrition and recovery data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIFeaturePage,
});

function AIFeaturePage() {
  const { feature } = Route.useParams();
  const navigate = useNavigate();
  const { hasTier } = usePremium();

  const meta = FEATURES.find((f) => f.key === feature);

  if (!meta) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-5">
        <BackLink />
        <h1 className="mt-4 font-display text-2xl text-foreground">Tool not found</h1>
        <p className="mt-2 text-xs text-muted-foreground">That AI tool does not exist. Head back to the AI Studio.</p>
      </div>
    );
  }

  const requiredTier = meta.tier ?? "essential";
  const locked = Boolean(meta.premium) && !hasTier(requiredTier);
  const tierLabel = requiredTier === "signature" ? "Signature" : "Essential";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-5">
      <BackLink />
      <div className="mt-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-deluxe-forest/30">
          <meta.icon className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0">
          <SectionLabel>AI Studio</SectionLabel>
          <h1 className="mt-1 font-display text-2xl text-foreground sm:text-3xl">{meta.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{meta.sub}</p>
        </div>
      </div>

      <div className="mt-6">
        {locked ? (
          <div className="border border-gold/20 bg-deluxe-black/40 p-6 text-center">
            <Lock className="mx-auto h-5 w-5 text-gold" />
            <div className="mt-3 font-display text-lg text-foreground">{tierLabel} membership required</div>
            <p className="mt-1 text-xs text-muted-foreground">
              This tool is part of the {tierLabel} tier. Upgrade to unlock it.
            </p>
            <button
              onClick={() => navigate({ to: "/pricing" })}
              className="mt-4 border border-gold bg-gold-gradient px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-deluxe-black"
            >
              View memberships
            </button>
          </div>
        ) : (
          <FeaturePanel feature={feature as FeatureKey} />
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/ai"
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
    >
      <ChevronLeft className="h-3.5 w-3.5" /> AI Studio
    </Link>
  );
}

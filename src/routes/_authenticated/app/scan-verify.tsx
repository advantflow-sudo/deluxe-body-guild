import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ScanLine } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { MealScanPanel } from "@/components/deluxe/MealScanPanel";
import { NutritionQuickLog } from "@/components/deluxe/NutritionQuickLog";
import { TodayNutritionRings } from "@/components/deluxe/TodayNutritionRings";

export const Route = createFileRoute("/_authenticated/app/scan-verify")({
  head: () => ({
    meta: [
      { title: "Scan Verification · Deluxe Fitness" },
      { name: "description", content: "Run the full food-photo scan, save and delete flow in one place to verify your meal logging works end to end." },
      { property: "og:title", content: "Scan Verification · Deluxe Fitness" },
      { property: "og:description", content: "Verify the food-photo scanner end to end: scan a meal, save the intake, edit or rescan the photo, then delete it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScanVerify,
});

const STEPS = [
  "Snap or upload a real meal photo and let the scanner analyse it.",
  "Review the foods, portions and macros, then confirm to log the intake.",
  "Check it appears in today's intake below with its photo, confidence and allergen notes.",
  "Use Rescan / edit to replace the photo or correct macros — it updates the same entry.",
  "Delete the entry to confirm the meal and its private photo are both removed.",
];

function ScanVerify() {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-8 sm:px-5">
      <Link to="/app/ai" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold">
        <ChevronLeft className="h-3 w-3" /> AI Studio
      </Link>
      <SectionLabel>Scan verification</SectionLabel>
      <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
        Full <span className="text-gold-gradient italic">scan → save → delete</span> flow
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Everything needed to verify meal scanning on one signed-in screen.
      </p>

      <ol className="mt-4 space-y-1.5 border border-gold/15 bg-deluxe-forest/15 p-3.5">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" aria-hidden />
            <span><span className="text-foreground">Step {i + 1}.</span> {s}</span>
          </li>
        ))}
      </ol>

      <section className="mt-5 border border-gold/25 bg-deluxe-forest/20 p-4" aria-labelledby="scan-heading">
        <div className="mb-3 flex items-center gap-2">
          <ScanLine className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel id="scan-heading">Meal scan</SectionLabel>
        </div>
        <MealScanPanel showRings={false} onSaved={() => setRefresh((k) => k + 1)} />
      </section>

      <TodayNutritionRings key={`rings-${refresh}`} className="mt-5" />
      <NutritionQuickLog key={`log-${refresh}`} />
    </div>
  );
}

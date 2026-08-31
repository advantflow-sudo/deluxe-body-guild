import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useGroceryList } from "@/hooks/useGroceryList";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { GroceryDelivery } from "@/components/deluxe/GroceryDelivery";

export const Route = createFileRoute("/_authenticated/app/grocery")({
  component: GroceryPage,
  head: () => ({
    meta: [
      { title: "My Grocery List | Deluxe Fitness" },
      {
        name: "description",
        content:
          "Every ingredient from your Deluxe meal plans in one list — amounts, tick-off as you shop, and a one-tap bulk clear.",
      },
      { property: "og:title", content: "My Grocery List | Deluxe Fitness" },
      {
        property: "og:description",
        content: "Shop your meal plan: amounts, tick-off and bulk clear.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function GroceryPage() {
  const { items, loading, toggle, remove, clearChecked, clearAll } = useGroceryList();
  const [confirmClear, setConfirmClear] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const i of items) {
      const key = i.source_meal?.trim() || "Other items";
      const arr = map.get(key) ?? [];
      arr.push(i);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0] === "Other items" ? 1 : b[0] === "Other items" ? -1 : a[0].localeCompare(b[0]),
    );
  }, [items]);

  const toBuy = items.filter((i) => !i.checked).length;
  const done = items.length - toBuy;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">
      <Link
        to="/app/nutrition"
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-gold"
      >
        <ArrowLeft className="h-3 w-3" /> Nutrition
      </Link>

      <header className="mt-4">
        <SectionLabel>Shopping</SectionLabel>
        <h1 className="font-display text-3xl text-foreground">My grocery list</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? "Loading your list…"
            : items.length === 0
              ? "Nothing here yet. Open a meal, tap Cook this meal and add its ingredients."
              : `${toBuy} to buy · ${done} in the basket · grouped by meal`}
        </p>
      </header>

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <OutlineButton
            onClick={() => {
              haptic();
              void clearChecked();
            }}
            disabled={done === 0}
          >
            Clear ticked ({done})
          </OutlineButton>
          {confirmClear ? (
            <>
              <GoldButton
                onClick={() => {
                  haptic();
                  void clearAll();
                  setConfirmClear(false);
                  toast.success("Grocery list cleared");
                }}
              >
                Yes, clear everything
              </GoldButton>
              <OutlineButton onClick={() => setConfirmClear(false)}>Cancel</OutlineButton>
            </>
          ) : (
            <OutlineButton onClick={() => setConfirmClear(true)}>
              <Trash2 className="mr-1 h-3 w-3" /> Clear all
            </OutlineButton>
          )}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="mt-6 border border-gold/15 bg-card/40 p-6 text-center">
          <ShoppingBasket className="mx-auto h-6 w-6 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">
            Your grocery list fills up from your meal plan's prep guides.
          </p>
          <Link to="/app/nutrition" className="mt-4 inline-block">
            <GoldButton>Open today's meal plan</GoldButton>
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {groups.map(([meal, rows]) => (
          <section key={meal}>
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>{meal}</span>
              <span>{rows.filter((r) => !r.checked).length} to buy</span>
            </div>
            <ul className="mt-2 divide-y divide-gold/10 border border-gold/15 bg-card/40">
              {rows.map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <button
                    onClick={() => {
                      haptic();
                      void toggle(g.id, !g.checked);
                    }}
                    aria-pressed={g.checked}
                    aria-label={`Mark ${g.item} ${g.checked ? "not bought" : "bought"}`}
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center border transition ${
                      g.checked ? "border-gold bg-gold/20 text-gold" : "border-gold/30"
                    }`}
                  >
                    {g.checked && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={`min-w-0 flex-1 ${g.checked ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {g.item}
                  </span>
                  {g.amount && (
                    <span className="shrink-0 text-xs text-muted-foreground">{g.amount}</span>
                  )}
                  <button
                    onClick={() => void remove(g.id)}
                    aria-label={`Remove ${g.item}`}
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {items.length > 0 && <GroceryDelivery items={items} />}
    </div>
  );
}

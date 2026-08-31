import { useMemo, useState } from "react";
import { CalendarClock, ExternalLink, Store, Truck, X, Check } from "lucide-react";
import { toast } from "sonner";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import {
  GROCERY_PARTNERS,
  DELIVERY_WINDOWS,
  upcomingDates,
  partnerById,
} from "@/config/grocery-partners";
import { useGroceryDelivery } from "@/hooks/useGroceryDelivery";
import type { GroceryItem } from "@/hooks/useGroceryList";
import { haptic } from "@/hooks/useHaptics";

interface Props {
  items: GroceryItem[];
}

/**
 * Sends the member's list to a real retailer (their own search/basket pages)
 * and stores the pickup / drop-off window they chose.
 */
export function GroceryDelivery({ items }: Props) {
  const { upcoming, loading, saving, book, cancel, markDone } = useGroceryDelivery();
  const [partnerId, setPartnerId] = useState(GROCERY_PARTNERS[0]!.id);
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [windowIndex, setWindowIndex] = useState(3);
  const [dateValue, setDateValue] = useState(upcomingDates()[0]!.value);
  const [note, setNote] = useState("");

  const dates = useMemo(() => upcomingDates(), []);
  const partner = partnerById(partnerId);
  const toBuy = items.filter((i) => !i.checked);

  const openPartner = () => {
    if (toBuy.length === 0) {
      toast.error("Nothing left to buy on your list.");
      return;
    }
    haptic();
    // One tab per item on the retailer's own search page, then their basket.
    const batch = toBuy.slice(0, 8);
    batch.forEach((i, idx) => {
      window.setTimeout(() => {
        window.open(partner.searchUrl(`${i.item}`), "_blank", "noopener");
      }, idx * 250);
    });
    window.setTimeout(() => window.open(partner.basketUrl, "_blank", "noopener"), batch.length * 250 + 300);
    if (toBuy.length > batch.length) {
      toast.info(`Opened the first ${batch.length} items at ${partner.name} — add the rest from your list.`);
    } else {
      toast.success(`Opened ${batch.length} items at ${partner.name}`);
    }
  };

  const copyList = async () => {
    const text = toBuy.map((i) => `${i.item}${i.amount ? ` — ${i.amount}` : ""}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("List copied — paste it into any shopping app");
    } catch {
      toast.error("Couldn't copy the list");
    }
  };

  const confirmWindow = async () => {
    const win = DELIVERY_WINDOWS[windowIndex]!;
    try {
      await book({
        partner: partner.name,
        fulfilment,
        windowDate: dateValue,
        startHour: win.startHour,
        endHour: win.endHour,
        addressNote: note,
        itemCount: toBuy.length,
      });
      toast.success(`${fulfilment === "pickup" ? "Collection" : "Delivery"} window saved`);
      setNote("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

  return (
    <section className="mt-8 border border-gold/20 bg-card/40 p-5">
      <SectionLabel>Delivery</SectionLabel>
      <h2 className="mt-2 font-display text-2xl text-foreground">Get this list delivered</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Pick a shop and we'll open your items on their site so you can check out in one basket. Save
        the window you booked and it'll show here with a reminder.
      </p>

      {/* Partner */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {GROCERY_PARTNERS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPartnerId(p.id);
              if (!p.supportsPickup) setFulfilment("delivery");
            }}
            className={`border p-3 text-left transition ${
              p.id === partnerId ? "border-gold bg-gold/10" : "border-gold/20 hover:border-gold/50"
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Store className="h-4 w-4 text-gold" /> {p.name}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{p.blurb}</div>
          </button>
        ))}
      </div>

      {/* Fulfilment */}
      <div className="mt-4 flex gap-2">
        {(["delivery", "pickup"] as const).map((f) => (
          <button
            key={f}
            disabled={f === "pickup" && !partner.supportsPickup}
            onClick={() => setFulfilment(f)}
            className={`flex-1 border px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition disabled:opacity-40 ${
              fulfilment === f ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-muted-foreground"
            }`}
          >
            {f === "delivery" ? "Drop-off" : "Pickup"}
          </button>
        ))}
      </div>

      {/* Date + window */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Day</span>
          <select
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="mt-1 w-full border border-gold/25 bg-deluxe-black px-3 py-2 text-sm text-foreground"
          >
            {dates.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {fulfilment === "pickup" ? "Collection window" : "Delivery window"}
          </span>
          <select
            value={windowIndex}
            onChange={(e) => setWindowIndex(Number(e.target.value))}
            className="mt-1 w-full border border-gold/25 bg-deluxe-black px-3 py-2 text-sm text-foreground"
          >
            {DELIVERY_WINDOWS.map((w, i) => (
              <option key={w.label} value={i}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          {fulfilment === "pickup" ? "Store / collection note" : "Address or door note"}
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={140}
          placeholder={fulfilment === "pickup" ? "Which branch you're collecting from" : "Leave with concierge, flat 12…"}
          className="mt-1 w-full border border-gold/25 bg-deluxe-black px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <GoldButton onClick={openPartner} disabled={toBuy.length === 0}>
          <ExternalLink className="mr-1 h-3 w-3" /> Send {toBuy.length} items to {partner.name}
        </GoldButton>
        <OutlineButton onClick={confirmWindow} disabled={saving}>
          <CalendarClock className="mr-1 h-3 w-3" /> {saving ? "Saving…" : "Save my window"}
        </OutlineButton>
        <OutlineButton onClick={copyList} disabled={toBuy.length === 0}>
          Copy list
        </OutlineButton>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Checkout, payment and the final slot happen on the retailer's site — Deluxe stores the window
        you booked so your plan and reminders line up. We're not the retailer.
      </p>

      {/* Booked windows */}
      {!loading && upcoming.length > 0 && (
        <div className="mt-6">
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Your windows</div>
          <ul className="mt-2 divide-y divide-gold/10 border border-gold/15">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                {b.fulfilment === "pickup" ? (
                  <Store className="h-4 w-4 shrink-0 text-gold" />
                ) : (
                  <Truck className="h-4 w-4 shrink-0 text-gold" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-foreground">
                    {b.partner} · {pad(b.window_start_hour)}–{pad(b.window_end_hour)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(`${b.window_date}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {b.item_count ? ` · ${b.item_count} items` : ""}
                    {b.address_note ? ` · ${b.address_note}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => void markDone(b.id)}
                  aria-label="Mark as received"
                  className="text-muted-foreground transition hover:text-gold"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void cancel(b.id)}
                  aria-label="Cancel window"
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

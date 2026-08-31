/**
 * Grocery partner hand-off.
 *
 * There is no merchant API contract with these retailers, so we do not pretend
 * to place orders. Instead we open each retailer's own search/add-to-basket URL
 * for every item, and store the pickup / drop-off window the member chose so
 * the app can remind them and show it on the list.
 */
export interface GroceryPartner {
  id: string;
  name: string;
  blurb: string;
  /** Builds a real search URL on the retailer's own site for one item. */
  searchUrl: (query: string) => string;
  /** Where the member finishes the order. */
  basketUrl: string;
  supportsPickup: boolean;
}

const enc = (q: string) => encodeURIComponent(q.trim());

export const GROCERY_PARTNERS: GroceryPartner[] = [
  {
    id: "tesco",
    name: "Tesco",
    blurb: "Home delivery or Click+Collect across the UK.",
    searchUrl: (q) => `https://www.tesco.com/groceries/en-GB/search?query=${enc(q)}`,
    basketUrl: "https://www.tesco.com/groceries/en-GB/basket",
    supportsPickup: true,
  },
  {
    id: "sainsburys",
    name: "Sainsbury's",
    blurb: "Same-day slots and collection points.",
    searchUrl: (q) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${enc(q)}`,
    basketUrl: "https://www.sainsburys.co.uk/gol-ui/trolley",
    supportsPickup: true,
  },
  {
    id: "ocado",
    name: "Ocado",
    blurb: "Wide protein and fresh range, next-day slots.",
    searchUrl: (q) => `https://www.ocado.com/search?entry=${enc(q)}`,
    basketUrl: "https://www.ocado.com/webshop/trolleyContents.do",
    supportsPickup: false,
  },
  {
    id: "instacart",
    name: "Instacart",
    blurb: "US stores, delivery in as little as an hour.",
    searchUrl: (q) => `https://www.instacart.com/store/s?k=${enc(q)}`,
    basketUrl: "https://www.instacart.com/store",
    supportsPickup: true,
  },
];

export function partnerById(id: string) {
  return GROCERY_PARTNERS.find((p) => p.id === id) ?? GROCERY_PARTNERS[0]!;
}

/** Selectable two-hour windows, in local time. */
export const DELIVERY_WINDOWS: { startHour: number; endHour: number; label: string }[] = [
  { startHour: 7, endHour: 9, label: "07:00 – 09:00" },
  { startHour: 9, endHour: 11, label: "09:00 – 11:00" },
  { startHour: 11, endHour: 13, label: "11:00 – 13:00" },
  { startHour: 13, endHour: 15, label: "13:00 – 15:00" },
  { startHour: 15, endHour: 17, label: "15:00 – 17:00" },
  { startHour: 17, endHour: 19, label: "17:00 – 19:00" },
  { startHour: 19, endHour: 21, label: "19:00 – 21:00" },
];

/** Next 5 selectable dates as YYYY-MM-DD in the member's local time. */
export function upcomingDates(count = 5): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      value,
      label:
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return out;
}

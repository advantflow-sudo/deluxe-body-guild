import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GroceryDelivery {
  id: string;
  partner: string;
  fulfilment: string;
  window_date: string;
  window_start_hour: number;
  window_end_hour: number;
  address_note: string | null;
  item_count: number;
  status: string;
}

export interface NewDelivery {
  partner: string;
  fulfilment: "delivery" | "pickup";
  windowDate: string;
  startHour: number;
  endHour: number;
  addressNote?: string;
  itemCount: number;
}

/** Scheduled pickup / drop-off windows for the member's grocery list. */
export function useGroceryDelivery() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<GroceryDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("grocery_deliveries")
      .select("id, partner, fulfilment, window_date, window_start_hour, window_end_hour, address_note, item_count, status")
      .eq("user_id", user.id)
      .order("window_date", { ascending: true })
      .limit(20);
    setBookings((data ?? []) as GroceryDelivery[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const book = useCallback(
    async (input: NewDelivery) => {
      if (!user) throw new Error("Not signed in");
      setSaving(true);
      try {
        const { error } = await supabase.from("grocery_deliveries").insert({
          user_id: user.id,
          partner: input.partner,
          fulfilment: input.fulfilment,
          window_date: input.windowDate,
          window_start_hour: input.startHour,
          window_end_hour: input.endHour,
          address_note: input.addressNote?.trim() || null,
          item_count: input.itemCount,
        });
        if (error) throw error;
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [user, refresh],
  );

  const cancel = useCallback(
    async (id: string) => {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      const { error } = await supabase.from("grocery_deliveries").delete().eq("id", id);
      if (error) await refresh();
    },
    [refresh],
  );

  const markDone = useCallback(
    async (id: string) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "collected" } : b)));
      const { error } = await supabase.from("grocery_deliveries").update({ status: "collected" }).eq("id", id);
      if (error) await refresh();
    },
    [refresh],
  );

  const upcoming = bookings.filter(
    (b) => b.status === "scheduled" && b.window_date >= new Date().toISOString().slice(0, 10),
  );

  return { bookings, upcoming, loading, saving, refresh, book, cancel, markDone };
}

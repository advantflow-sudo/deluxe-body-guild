/**
 * Persistent grocery list synced with the meal-prep shopping list.
 * Items are stored per member in public.grocery_items and de-duplicated by name.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GroceryItem {
  id: string;
  item: string;
  amount: string | null;
  source_meal: string | null;
  checked: boolean;
}

export function useGroceryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("grocery_items")
      .select("id, item, amount, source_meal, checked")
      .eq("user_id", user.id)
      .order("checked", { ascending: true })
      .order("item", { ascending: true });
    setItems((data ?? []) as GroceryItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Upsert a batch of shopping-list rows into the member's grocery list. */
  const addMany = useCallback(
    async (rows: { item: string; amount?: string; sourceMeal?: string }[]) => {
      if (!user || rows.length === 0) return 0;
      setSyncing(true);
      try {
        const payload = rows
          .filter((r) => r.item.trim())
          .map((r) => ({
            user_id: user.id,
            item: r.item.trim(),
            amount: r.amount?.trim() || null,
            source_meal: r.sourceMeal ?? null,
          }));
        const { error } = await supabase
          .from("grocery_items")
          .upsert(payload, { onConflict: "user_id,item" });
        if (error) throw error;
        await refresh();
        return payload.length;
      } finally {
        setSyncing(false);
      }
    },
    [user, refresh],
  );

  const toggle = useCallback(
    async (id: string, checked: boolean) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
      const { error } = await supabase.from("grocery_items").update({ checked }).eq("id", id);
      if (error) await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error } = await supabase.from("grocery_items").delete().eq("id", id);
      if (error) await refresh();
    },
    [refresh],
  );

  const clearChecked = useCallback(async () => {
    if (!user) return;
    const ids = items.filter((i) => i.checked).map((i) => i.id);
    if (!ids.length) return;
    setItems((prev) => prev.filter((i) => !i.checked));
    const { error } = await supabase.from("grocery_items").delete().in("id", ids);
    if (error) await refresh();
  }, [items, user, refresh]);

  return { items, loading, syncing, refresh, addMany, toggle, remove, clearChecked };
}

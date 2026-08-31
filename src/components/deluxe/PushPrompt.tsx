import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton } from "@/components/deluxe/ui";
import { getVapidPublicKey } from "@/lib/push.functions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function keyToBase64Url(key: ArrayBuffer | null) {
  if (!key) return null;
  let str = "";
  new Uint8Array(key).forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Real Web Push opt-in: asks permission, creates a browser PushSubscription
 * with our VAPID key, and stores the encryption keys so the server can deliver.
 */
export function PushPrompt() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [hasSub, setHasSub] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh")
      .eq("user_id", user.id);
    // Only a real browser subscription counts as "already enabled".
    setHasSub((data ?? []).some((r) => r.endpoint.startsWith("http") && r.p256dh !== "pending"));
  }, [user]);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    void refresh();
  }, [refresh]);

  if (!supported || !user) return null;
  if (permission === "granted" && hasSub) return null;

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Notifications are blocked in your browser settings.");
        return;
      }

      const { publicKey } = await getVapidPublicKey();
      const reg = await navigator.serviceWorker.ready;

      if (!publicKey) {
        toast.error("Push isn't configured yet — you'll still get in-app reminders.");
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
      const p256dh = json.keys?.p256dh ?? keyToBase64Url(sub.getKey("p256dh"));
      const auth = json.keys?.auth ?? keyToBase64Url(sub.getKey("auth"));
      if (!p256dh || !auth) {
        toast.error("Your browser didn't return push keys.");
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth_key: auth,
          user_agent: navigator.userAgent.slice(0, 200),
        },
        { onConflict: "endpoint" },
      );
      if (error) throw error;

      // Clear out any legacy placeholder rows so the server never tries them.
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("p256dh", "pending");

      setHasSub(true);
      toast.success("Push reminders enabled");
    } catch {
      toast.error("Couldn't enable notifications");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <Bell className="w-5 h-5 text-primary" />
      <div className="flex-1">
        <div className="text-sm font-medium">Daily reminders</div>
        <div className="text-xs text-muted-foreground">Get a nudge for your mission and streak.</div>
      </div>
      <GoldButton onClick={enable} disabled={busy} className="px-3 py-1.5 text-xs">
        {busy ? "Enabling…" : "Enable"}
      </GoldButton>
    </div>
  );
}

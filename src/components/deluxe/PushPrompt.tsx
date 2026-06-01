import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton } from "@/components/deluxe/ui";

/**
 * Lightweight push opt-in. Stores subscription rows so a future worker
 * can deliver Web Push when VAPID keys are configured.
 */
export function PushPrompt() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [hasSub, setHasSub] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    if (!user) return;
    supabase.from("push_subscriptions").select("id").eq("user_id", user.id).limit(1)
      .then(({ data }) => setHasSub((data?.length ?? 0) > 0));
  }, [user]);

  if (!supported || !user) return null;
  if (permission === "granted" && hasSub) return null;

  const enable = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;
      // Record a lightweight subscription marker — real web-push subscribe requires VAPID keys.
      await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint: `local:${user.id}:${Date.now()}`,
        p256dh: "pending",
        auth_key: "pending",
        user_agent: navigator.userAgent.slice(0, 200),
      });
      setHasSub(true);
      toast.success("Reminders enabled");
    } catch (e) {
      toast.error("Couldn't enable notifications");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <Bell className="w-5 h-5 text-primary" />
      <div className="flex-1">
        <div className="text-sm font-medium">Daily reminders</div>
        <div className="text-xs text-muted-foreground">Get a nudge for your mission and streak.</div>
      </div>
      <GoldButton onClick={enable} className="px-3 py-1.5 text-xs">Enable</GoldButton>
    </div>
  );
}

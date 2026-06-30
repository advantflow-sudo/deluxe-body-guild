import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/deluxe/BottomNav";
import { NotificationBell } from "@/components/deluxe/NotificationBell";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  const { user } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "needs-onboarding">("loading");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles_ext")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setState(data?.onboarded_at ? "ok" : "needs-onboarding");
      });
  }, [user]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deluxe-black">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (state === "needs-onboarding") return <Navigate to="/onboarding" />;

  return (
    <div className="min-h-screen bg-deluxe-black pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}

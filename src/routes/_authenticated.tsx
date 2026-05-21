import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deluxe-black">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return <Outlet />;
}

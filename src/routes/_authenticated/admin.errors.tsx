import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/admin/errors")({
  head: () => ({
    meta: [
      { title: "Error Monitoring — Admin" },
      { name: "description", content: "Review production crashes and client errors captured across Deluxe Fitness." },
      { property: "og:title", content: "Error Monitoring — Admin" },
      { property: "og:description", content: "Review production crashes and client errors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ErrorMonitoringPage,
});

const SEVERITIES = ["all", "fatal", "error", "warning"] as const;

function ErrorMonitoringPage() {
  const { isAdmin, loading } = useAdmin();
  const [severity, setSeverity] = useState<string>("all");

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["app-error-events", severity],
    enabled: isAdmin,
    queryFn: async () => {
      let query = supabase
        .from("app_error_events")
        .select("id, severity, source, message, route, release, created_at, alerted_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (severity !== "all") query = query.eq("severity", severity);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Admins only.</p>
        <Link to="/app" className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionLabel>Production Monitoring</SectionLabel>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl">Error &amp; Crash Log</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Uncaught browser errors, promise rejections and server failures. Fatal crashes also fire an
        operational alert.
      </p>
      <GoldDivider className="my-6" />

      <div className="flex flex-wrap items-center gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
              severity === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
        <OutlineButton onClick={() => void refetch()} className="ml-auto">
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </OutlineButton>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-400">Could not load errors: {(error as Error).message}</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {(data ?? []).map((row) => (
          <li key={row.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  row.severity === "fatal"
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                }`}
              >
                <AlertTriangle className="h-3 w-3" /> {row.severity}
              </span>
              <span className="text-muted-foreground">{row.source}</span>
              <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
              {row.alerted_at ? <span className="text-emerald-400">alerted</span> : null}
            </div>
            <p className="mt-2 break-words text-sm">{row.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.route ?? "unknown route"} · {row.release ?? "unknown release"}
            </p>
          </li>
        ))}
        {data && data.length === 0 ? (
          <li className="rounded-xl border border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
            No errors recorded. That is the goal.
          </li>
        ) : null}
      </ul>

      <Link to="/app" className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to app
      </Link>
    </div>
  );
}

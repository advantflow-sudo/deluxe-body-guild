import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, RefreshCw, ShieldAlert, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { listWebhookDeliveries, replayWebhookEvent } from "@/lib/stripe-admin.functions";
import { OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/admin/webhooks")({
  head: () => ({
    meta: [
      { title: "Webhook Deliveries — Admin" },
      { name: "description", content: "Inspect and replay Stripe webhook deliveries for Deluxe Fitness." },
      { property: "og:title", content: "Webhook Deliveries — Admin" },
      { property: "og:description", content: "Inspect and replay Stripe webhook deliveries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WebhookAdminPage,
});

const STATUSES = ["all", "received", "processed", "error", "replaying"] as const;
const SOURCES = ["all", "stripe", "replay", "scheduled-test"] as const;

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${
        ok
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/40 bg-red-500/10 text-red-400"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function WebhookAdminPage() {
  const { isAdmin, loading } = useAdmin();
  const fetchDeliveries = useServerFn(listWebhookDeliveries);
  const replay = useServerFn(replayWebhookEvent);

  const [status, setStatus] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [replayId, setReplayId] = useState("");
  const [replayPayload, setReplayPayload] = useState("");
  const [force, setForce] = useState(false);

  const filters = { status, eventType, onlySource: source, onlyVerificationFailures: onlyFailures };
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["webhook-deliveries", filters],
    queryFn: () => fetchDeliveries({ data: filters }),
    enabled: isAdmin,
  });

  const replayMutation = useMutation({
    mutationFn: () =>
      replay({ data: { eventId: replayId, rawPayload: replayPayload || undefined, force } }),
    onSuccess: (res) => {
      toast.success(
        res.duplicate ? "Already processed — duplicate ignored" : `Replayed ${res.eventId}`,
      );
      refetch();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deluxe-black">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-deluxe-black px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-gold" />
        <SectionLabel>Restricted</SectionLabel>
        <h1 className="font-display text-3xl text-foreground">Admin access only</h1>
        <Link to="/app">
          <OutlineButton>Back to app</OutlineButton>
        </Link>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-deluxe-black px-5 pb-24 pt-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Billing operations</SectionLabel>
            <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">Webhook deliveries</h1>
          </div>
          <OutlineButton onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 inline h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </OutlineButton>
        </div>

        <GoldDivider className="my-6" />

        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Deliveries", value: stats.total },
              { label: "Processed", value: stats.processed },
              { label: "Errors", value: stats.errors },
              { label: "Signature fails", value: stats.signatureFailures },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-2xl text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-white/15 bg-deluxe-black px-3 py-2 text-xs text-foreground"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
            ))}
          </select>
          <select
            aria-label="Filter by event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="rounded-md border border-white/15 bg-deluxe-black px-3 py-2 text-xs text-foreground"
          >
            <option value="all">All event types</option>
            {(data?.eventTypes ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Filter by source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-white/15 bg-deluxe-black px-3 py-2 text-xs text-foreground"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All sources" : s}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyFailures}
              onChange={(e) => setOnlyFailures(e.target.checked)}
              className="accent-gold"
            />
            Verification failures only
          </label>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            {(error as Error).message}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-white/[0.03] text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="p-3">Received</th>
                <th className="p-3">Event</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source</th>
                <th className="p-3">Signature</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">Detail</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data?.deliveries ?? []).map((d) => (
                <tr key={d.id} className="border-t border-white/5 align-top">
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {new Date(d.received_at).toLocaleString()}
                  </td>
                  <td className="max-w-[160px] break-all p-3 font-mono text-[10px] text-muted-foreground">
                    {d.stripe_event_id ?? "—"}
                  </td>
                  <td className="p-3 text-foreground">{d.event_type}</td>
                  <td className="p-3">
                    <Pill ok={d.status === "processed"} label={d.status} />
                  </td>
                  <td className="p-3 text-muted-foreground">{d.source ?? "stripe"}</td>
                  <td className="p-3">
                    {d.signature_verified === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Pill ok={d.signature_verified} label={d.signature_verified ? "verified" : "failed"} />
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{d.attempts ?? 1}</td>
                  <td className="max-w-[260px] break-words p-3 text-muted-foreground">
                    {d.error_message ?? [d.tier, d.stripe_customer_id].filter(Boolean).join(" · ") ?? ""}
                  </td>
                  <td className="p-3">
                    {d.stripe_event_id && (
                      <button
                        onClick={() => {
                          setReplayId(d.stripe_event_id!);
                          setReplayPayload("");
                          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }}
                        className="text-[9px] uppercase tracking-[0.2em] text-gold hover:underline"
                      >
                        Replay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isFetching && (data?.deliveries?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No deliveries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Replay */}
        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <SectionLabel>Replay a failed event</SectionLabel>
          <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
            Enter a Stripe event id. Leave the payload blank to re-fetch the event from Stripe, or paste the
            full raw event JSON. Processing is idempotent — already-processed events are ignored unless you
            force a re-run.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={replayId}
              onChange={(e) => setReplayId(e.target.value)}
              placeholder="evt_1AbC..."
              aria-label="Stripe event id"
              className="w-full rounded-md border border-white/15 bg-deluxe-black px-3 py-2 font-mono text-xs text-foreground"
            />
            <textarea
              value={replayPayload}
              onChange={(e) => setReplayPayload(e.target.value)}
              placeholder='Optional raw payload: {"id":"evt_...","type":"customer.subscription.updated","data":{"object":{...}}}'
              rows={5}
              aria-label="Raw event payload"
              className="w-full rounded-md border border-white/15 bg-deluxe-black px-3 py-2 font-mono text-[11px] text-foreground"
            />
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-gold" />
                Force re-run (ignore idempotency guard)
              </label>
              <OutlineButton
                onClick={() => replayMutation.mutate()}
                disabled={!replayId || replayMutation.isPending}
              >
                <PlayCircle className="mr-2 inline h-3 w-3" />
                {replayMutation.isPending ? "Replaying…" : "Replay event"}
              </OutlineButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

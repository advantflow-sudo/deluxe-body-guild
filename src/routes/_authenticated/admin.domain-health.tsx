import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Globe2, Lock } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { getDomainHealth } from "@/lib/domain-health.functions";
import { OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/admin/domain-health")({
  head: () => ({
    meta: [
      { title: "Domain Health — Admin" },
      { name: "description", content: "Live DNS and SSL status for deluxefitness.app." },
    ],
  }),
  component: DomainHealthPage,
});

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${
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

function DomainHealthPage() {
  const { isAdmin, loading } = useAdmin();
  const fetchHealth = useServerFn(getDomainHealth);

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["domain-health"],
    queryFn: () => fetchHealth(),
    enabled: isAdmin,
    refetchInterval: 60_000,
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
      <div className="flex min-h-screen items-center justify-center bg-deluxe-black px-6 text-center">
        <div>
          <h1 className="font-serif text-2xl text-deluxe-gold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have access to this page.
          </p>
          <div className="mt-6">
            <Link to="/">
              <OutlineButton>
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back home
              </OutlineButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deluxe-black px-4 py-10 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/_authenticated/admin" className="inline-flex items-center text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-deluxe-gold">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Admin
          </Link>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-full border border-deluxe-gold/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-deluxe-gold hover:bg-deluxe-gold/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-8">
          <SectionLabel>Operations</SectionLabel>
          <h1 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">Domain Health</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Live DNS and HTTPS status for <span className="text-deluxe-gold">deluxefitness.app</span>.
            Expected IP: <code className="text-foreground">{data?.expectedIp ?? "185.158.133.1"}</code>.
          </p>
          <GoldDivider className="mt-6" />
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
            Failed to load health report: {(error as Error).message}
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <Globe2 className="h-4 w-4" /> DNS
                  </div>
                  <StatusPill ok={data.allDnsHealthy} label={data.allDnsHealthy ? "Healthy" : "Issue"} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {data.allDnsHealthy
                    ? "Every resolver returns only the Lovable IP. Users worldwide will reach your app."
                    : "At least one resolver is returning a wrong or extra IP. Some users still hit the wrong server."}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <Lock className="h-4 w-4" /> HTTPS / SSL
                  </div>
                  <StatusPill ok={data.allHttpsHealthy} label={data.allHttpsHealthy ? "Live" : "Issue"} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {data.allHttpsHealthy
                    ? "Both apex and www respond with a valid certificate over HTTPS."
                    : "One of the domains is not responding correctly over HTTPS."}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">DNS Resolvers</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Resolver</th>
                      <th className="px-4 py-2.5">Domain</th>
                      <th className="px-4 py-2.5">Resolved IPs</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dns.map((row, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-4 py-3 text-foreground">{row.resolver}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.domain}</td>
                        <td className="px-4 py-3">
                          {row.ips.length === 0 ? (
                            <span className="text-red-400">{row.error ?? "no answer"}</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {row.ips.map((ip) => (
                                <code
                                  key={ip}
                                  className={`rounded px-1.5 py-0.5 text-xs ${
                                    ip === data.expectedIp
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {ip}
                                </code>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill ok={row.ok} label={row.ok ? "OK" : "Bad"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">HTTPS Endpoints</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Domain</th>
                      <th className="px-4 py-2.5">HTTP</th>
                      <th className="px-4 py-2.5">Server</th>
                      <th className="px-4 py-2.5">HSTS</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.https.map((row) => (
                      <tr key={row.domain} className="border-t border-white/5">
                        <td className="px-4 py-3 text-foreground">{row.domain}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.status ?? <span className="text-red-400">{row.error ?? "error"}</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.server ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.hsts ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">
                          <StatusPill ok={row.ok} label={row.ok ? "OK" : "Bad"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Checked {new Date(data.checkedAt).toLocaleString()} · auto-refreshes every 60s
            </p>
          </>
        )}
      </div>
    </div>
  );
}

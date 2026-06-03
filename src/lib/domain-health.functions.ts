import { createServerFn } from "@tanstack/react-start";

const EXPECTED_IP = "185.158.133.1";
const DOMAINS = ["deluxefitness.app", "www.deluxefitness.app"] as const;
const RESOLVERS = [
  { name: "Google", url: "https://dns.google/resolve" },
  { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query" },
] as const;

export interface ResolverResult {
  resolver: string;
  domain: string;
  ips: string[];
  ok: boolean;
  error?: string;
}

export interface HttpsResult {
  domain: string;
  status: number | null;
  ok: boolean;
  server?: string;
  hsts: boolean;
  error?: string;
}

export interface DomainHealthReport {
  expectedIp: string;
  checkedAt: string;
  dns: ResolverResult[];
  https: HttpsResult[];
  allDnsHealthy: boolean;
  allHttpsHealthy: boolean;
}

async function resolveA(resolverUrl: string, domain: string): Promise<string[]> {
  const r = await fetch(`${resolverUrl}?name=${domain}&type=A`, {
    headers: { accept: "application/dns-json" },
  });
  if (!r.ok) throw new Error(`resolver HTTP ${r.status}`);
  const json = (await r.json()) as { Answer?: Array<{ type: number; data: string }> };
  return (json.Answer ?? []).filter((a) => a.type === 1).map((a) => a.data);
}

async function checkHttps(domain: string): Promise<HttpsResult> {
  try {
    const r = await fetch(`https://${domain}/`, { method: "HEAD", redirect: "manual" });
    return {
      domain,
      status: r.status,
      ok: r.status >= 200 && r.status < 400,
      server: r.headers.get("server") ?? undefined,
      hsts: !!r.headers.get("strict-transport-security"),
    };
  } catch (e) {
    return { domain, status: null, ok: false, hsts: false, error: (e as Error).message };
  }
}

export const getDomainHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<DomainHealthReport> => {
    const dnsChecks = await Promise.all(
      RESOLVERS.flatMap((res) =>
        DOMAINS.map(async (domain): Promise<ResolverResult> => {
          try {
            const ips = await resolveA(res.url, domain);
            const onlyExpected = ips.length > 0 && ips.every((ip) => ip === EXPECTED_IP);
            return { resolver: res.name, domain, ips, ok: onlyExpected };
          } catch (e) {
            return {
              resolver: res.name,
              domain,
              ips: [],
              ok: false,
              error: (e as Error).message,
            };
          }
        }),
      ),
    );

    const httpsChecks = await Promise.all(DOMAINS.map(checkHttps));

    return {
      expectedIp: EXPECTED_IP,
      checkedAt: new Date().toISOString(),
      dns: dnsChecks,
      https: httpsChecks,
      allDnsHealthy: dnsChecks.every((d) => d.ok),
      allHttpsHealthy: httpsChecks.every((h) => h.ok),
    };
  },
);

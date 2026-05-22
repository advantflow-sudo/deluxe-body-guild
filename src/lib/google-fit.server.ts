/**
 * Google Fit OAuth + Fitness API helpers (server-only).
 *
 * Heads up: Google Fit REST is scheduled to shut down in 2026 in favour of
 * Health Connect (Android-native). The OAuth flow below works today; the
 * Health Connect migration path lives in the iOS-style Capacitor bridge
 * (see `src/lib/healthkit-sync.ts` for the equivalent native pattern).
 */

export const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.body.read",
];

export const REDIRECT_URI =
  process.env.GOOGLE_FIT_REDIRECT_URI ||
  "https://deluxefitness.app/api/public/google-fit/callback";

export function buildAuthorizeUrl({ clientId, state }: { clientId: string; state: string }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_FIT_SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens({
  code,
  clientId,
  clientSecret,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
}) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

export async function refreshAccessToken({
  refreshToken,
  clientId,
  clientSecret,
}: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

/**
 * Aggregate a single data type into a single bucket between `start` and `end`.
 * Returns the summed value (steps, calories) or the average (heart rate).
 */
export async function fetchFitnessAggregate({
  accessToken,
  dataType,
  dataSourceId,
  start,
  end,
}: {
  accessToken: string;
  dataType: string;
  dataSourceId?: string;
  start: Date;
  end: Date;
}): Promise<number | null> {
  const body: Record<string, unknown> = {
    aggregateBy: [dataSourceId ? { dataTypeName: dataType, dataSourceId } : { dataTypeName: dataType }],
    bucketByTime: { durationMillis: end.getTime() - start.getTime() },
    startTimeMillis: start.getTime(),
    endTimeMillis: end.getTime(),
  };

  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    console.error("[google-fit] aggregate failed", dataType, res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as {
    bucket?: Array<{
      dataset?: Array<{
        point?: Array<{
          value?: Array<{ intVal?: number; fpVal?: number }>;
        }>;
      }>;
    }>;
  };

  let total = 0;
  let count = 0;
  for (const bucket of json.bucket ?? []) {
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        for (const v of point.value ?? []) {
          const n = v.intVal ?? v.fpVal;
          if (typeof n === "number") {
            total += n;
            count += 1;
          }
        }
      }
    }
  }
  if (count === 0) return null;
  // Heart rate is averaged; everything else is summed.
  if (dataType === "com.google.heart_rate.bpm") return total / count;
  return total;
}

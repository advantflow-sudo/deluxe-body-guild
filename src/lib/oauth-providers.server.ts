/**
 * Generic OAuth 2.0 + fitness-data registry (server-only).
 *
 * Each provider declares:
 *   - how to build the authorize URL
 *   - how to exchange the code / refresh tokens
 *   - how to pull today's steps / calories / heart rate
 *
 * Add a new OAuth 2.0 provider here and the rest of the pipeline (connect
 * server fn, callback route, sync server fn, cron) picks it up automatically.
 *
 * Garmin is intentionally NOT in this file — it uses OAuth 1.0a and needs a
 * separate flow.
 */

export type SupportedProvider = "fitbit" | "strava" | "oura";

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

export interface FitnessSnapshot {
  steps?: number;
  calories?: number;
  heart_rate?: number;
}

export interface ProviderConfig {
  id: SupportedProvider;
  displayName: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  /** Some providers (Fitbit) require Basic auth on the token endpoint. */
  tokenAuth: "basic" | "body";
  redirectPath: string;
  fetchToday: (accessToken: string) => Promise<FitnessSnapshot>;
}

const baseOrigin =
  process.env.OAUTH_REDIRECT_ORIGIN || "https://deluxefitness.app";

const redirectFor = (provider: SupportedProvider) =>
  `${baseOrigin}/api/public/oauth/${provider}/callback`;

// ---------- Fitbit ----------
async function fetchFitbitToday(accessToken: string): Promise<FitnessSnapshot> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [activities, heart] = await Promise.all([
    fetch("https://api.fitbit.com/1/user/-/activities/date/today.json", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch("https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const snapshot: FitnessSnapshot = {};
  const summary = (activities as { summary?: { steps?: number; caloriesOut?: number } } | null)?.summary;
  if (typeof summary?.steps === "number") snapshot.steps = summary.steps;
  if (typeof summary?.caloriesOut === "number") snapshot.calories = summary.caloriesOut;

  const heartDay = (heart as {
    "activities-heart"?: Array<{ value?: { restingHeartRate?: number } }>;
  } | null)?.["activities-heart"]?.[0]?.value?.restingHeartRate;
  if (typeof heartDay === "number") snapshot.heart_rate = heartDay;

  return snapshot;
}

// ---------- Strava ----------
async function fetchStravaToday(accessToken: string): Promise<FitnessSnapshot> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const after = Math.floor(start.getTime() / 1000);

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return {};
  const activities = (await res.json()) as Array<{
    calories?: number;
    average_heartrate?: number;
  }>;

  let calories = 0;
  let hrTotal = 0;
  let hrCount = 0;
  for (const a of activities) {
    if (typeof a.calories === "number") calories += a.calories;
    if (typeof a.average_heartrate === "number") {
      hrTotal += a.average_heartrate;
      hrCount += 1;
    }
  }
  const snapshot: FitnessSnapshot = {};
  if (calories > 0) snapshot.calories = calories;
  if (hrCount > 0) snapshot.heart_rate = hrTotal / hrCount;
  // Strava does not expose step count.
  return snapshot;
}

// ---------- Oura ----------
async function fetchOuraToday(accessToken: string): Promise<FitnessSnapshot> {
  const today = new Date().toISOString().slice(0, 10);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [activity, heart] = await Promise.all([
    fetch(
      `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${today}&end_date=${today}`,
      { headers },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=${today}T00:00:00-00:00`,
      { headers },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const snapshot: FitnessSnapshot = {};
  const today0 = (activity as {
    data?: Array<{ steps?: number; active_calories?: number }>;
  } | null)?.data?.[0];
  if (typeof today0?.steps === "number") snapshot.steps = today0.steps;
  if (typeof today0?.active_calories === "number") snapshot.calories = today0.active_calories;

  const hrPoints = (heart as { data?: Array<{ bpm?: number }> } | null)?.data;
  if (hrPoints && hrPoints.length > 0) {
    const valid = hrPoints.filter((p) => typeof p.bpm === "number");
    if (valid.length > 0) snapshot.heart_rate = valid.reduce((s, p) => s + (p.bpm ?? 0), 0) / valid.length;
  }
  return snapshot;
}

// ---------- Registry ----------
export const PROVIDERS: Record<SupportedProvider, ProviderConfig> = {
  fitbit: {
    id: "fitbit",
    displayName: "Fitbit",
    authorizeUrl: "https://www.fitbit.com/oauth2/authorize",
    tokenUrl: "https://api.fitbit.com/oauth2/token",
    scopes: "activity heartrate profile",
    tokenAuth: "basic",
    redirectPath: redirectFor("fitbit"),
    fetchToday: fetchFitbitToday,
  },
  strava: {
    id: "strava",
    displayName: "Strava",
    authorizeUrl: "https://www.strava.com/oauth/authorize",
    tokenUrl: "https://www.strava.com/oauth/token",
    scopes: "activity:read,profile:read_all",
    tokenAuth: "body",
    redirectPath: redirectFor("strava"),
    fetchToday: fetchStravaToday,
  },
  oura: {
    id: "oura",
    displayName: "Oura Ring",
    authorizeUrl: "https://cloud.ouraring.com/oauth/authorize",
    tokenUrl: "https://api.ouraring.com/oauth/token",
    scopes: "daily heartrate personal",
    tokenAuth: "body",
    redirectPath: redirectFor("oura"),
    fetchToday: fetchOuraToday,
  },
};

export function getProvider(id: string): ProviderConfig | null {
  return (PROVIDERS as Record<string, ProviderConfig>)[id] ?? null;
}

function credsFor(provider: SupportedProvider) {
  const upper = provider.toUpperCase();
  const clientId = process.env[`${upper}_CLIENT_ID`];
  const clientSecret = process.env[`${upper}_CLIENT_SECRET`];
  return { clientId, clientSecret };
}

export function getProviderCreds(provider: SupportedProvider) {
  const { clientId, clientSecret } = credsFor(provider);
  if (!clientId || !clientSecret) {
    throw new Error(`Missing OAuth credentials for ${provider}`);
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(p: ProviderConfig, state: string) {
  const { clientId } = getProviderCreds(p.id);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: p.redirectPath,
    response_type: "code",
    scope: p.scopes,
    state,
  });
  // Strava wants approval_prompt; Fitbit accepts prompt=consent.
  if (p.id === "strava") params.set("approval_prompt", "auto");
  if (p.id === "fitbit") params.set("prompt", "consent");
  return `${p.authorizeUrl}?${params.toString()}`;
}

async function postToken(p: ProviderConfig, body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = getProviderCreds(p.id);
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (p.tokenAuth === "basic") {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${creds}`;
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }
  const res = await fetch(p.tokenUrl, { method: "POST", headers, body });
  if (!res.ok) {
    throw new Error(`${p.id} token endpoint ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeCode(p: ProviderConfig, code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: p.redirectPath,
  });
  return postToken(p, body);
}

export async function refreshToken(p: ProviderConfig, refresh_token: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
  });
  return postToken(p, body);
}

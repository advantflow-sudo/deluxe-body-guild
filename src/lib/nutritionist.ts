/**
 * Nutritionist API client.
 *
 * Wraps /api/chat with typed failure classification, exponential-backoff
 * retries for temporary failures, client error reporting, and a premium
 * offline fallback so the nutrition page always renders something useful.
 */
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/monitoring";

export type NutritionistFailure =
  | "rate_limited"
  | "out_of_credits"
  | "session_expired"
  | "unavailable"
  | "bad_response";

export class NutritionistError extends Error {
  kind: NutritionistFailure;
  status: number;
  retryable: boolean;
  retryAfterMs?: number;

  constructor(kind: NutritionistFailure, message: string, status = 0, retryAfterMs?: number) {
    super(message);
    this.name = "NutritionistError";
    this.kind = kind;
    this.status = status;
    this.retryable = kind === "rate_limited" || kind === "unavailable";
    this.retryAfterMs = retryAfterMs;
  }
}

export const FAILURE_COPY: Record<NutritionistFailure, { title: string; detail: string }> = {
  rate_limited: {
    title: "Nutritionist is rate limited",
    detail: "Too many requests in a short window. It clears on its own — retry in a moment.",
  },
  out_of_credits: {
    title: "AI credits exhausted",
    detail: "The workspace has run out of AI credits. Top up credits to bring the nutritionist back online.",
  },
  session_expired: {
    title: "Your session expired",
    detail: "Sign in again so your requests can be authorised — your plan and logs are safe.",
  },
  unavailable: {
    title: "Nutritionist is temporarily unavailable",
    detail: "The AI service didn't respond. We retried automatically — try once more, or use the offline guidance below.",
  },
  bad_response: {
    title: "Couldn't read the nutritionist's reply",
    detail: "The response came back malformed. Retrying usually fixes it.",
  },
};

function classify(status: number, retryAfterMs?: number): NutritionistError {
  if (status === 429) return new NutritionistError("rate_limited", FAILURE_COPY.rate_limited.detail, status, retryAfterMs);
  if (status === 402 || status === 403)
    return new NutritionistError("out_of_credits", FAILURE_COPY.out_of_credits.detail, status);
  if (status === 401) return new NutritionistError("session_expired", FAILURE_COPY.session_expired.detail, status);
  return new NutritionistError("unavailable", FAILURE_COPY.unavailable.detail, status, retryAfterMs);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function once(prompt: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    const err = new NutritionistError("session_expired", FAILURE_COPY.session_expired.detail, 0);
    reportError({
      message: "nutritionist: missing auth token before /api/chat call",
      severity: "warning",
      extra: { area: "nutrition", kind: err.kind },
    });
    throw err;
  }

  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-deluxe-client": "nutrition",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], client: "nutrition" }),
    });
  } catch (e) {
    throw new NutritionistError(
      "unavailable",
      "Network request to the nutritionist failed.",
      0,
    );
  }

  if (!res.ok || !res.body) {
    const retryAfter = Number(res.headers.get("retry-after"));
    throw classify(res.status, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return acc;
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content as string | undefined;
        if (c) acc += c;
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  if (!acc.trim()) throw new NutritionistError("bad_response", FAILURE_COPY.bad_response.detail, 200);
  return acc;
}

/** Calls the nutritionist with exponential backoff on temporary failures. */
export async function askNutritionist(
  prompt: string,
  opts: { attempts?: number; onRetry?: (attempt: number, waitMs: number) => void } = {},
): Promise<string> {
  const attempts = opts.attempts ?? 3;
  let lastErr: NutritionistError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await once(prompt);
    } catch (e) {
      const err =
        e instanceof NutritionistError
          ? e
          : new NutritionistError("unavailable", e instanceof Error ? e.message : "Unknown failure");
      lastErr = err;
      if (!err.retryable || attempt === attempts) break;
      const wait = err.retryAfterMs ?? Math.round(600 * 2 ** (attempt - 1) * (1 + Math.random() * 0.3));
      opts.onRetry?.(attempt, wait);
      await sleep(wait);
    }
  }

  reportError({
    message: `nutritionist call failed: ${lastErr?.kind ?? "unknown"}`,
    severity: "error",
    extra: { area: "nutrition", status: lastErr?.status ?? 0, attempts },
  });
  throw lastErr ?? new NutritionistError("unavailable", FAILURE_COPY.unavailable.detail);
}

export interface FallbackContext {
  goal?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals?: { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[];
}

/** Deterministic premium guidance used when the AI service can't be reached. */
export function fallbackGuidance(question: string, ctx: FallbackContext): string {
  const goal = ctx.goal ?? "lean muscle";
  const meals = ctx.meals ?? [];
  const logged = meals.reduce(
    (a, m) => ({
      kcal: a.kcal + Number(m.kcal ?? 0),
      protein: a.protein + Number(m.protein_g ?? 0),
      carbs: a.carbs + Number(m.carbs_g ?? 0),
      fat: a.fat + Number(m.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const gap = (target: number, have: number) => Math.max(0, Math.round(target - have));
  const perMealProtein = Math.max(25, Math.round(ctx.protein / Math.max(1, meals.length || 4)));

  return [
    `Offline guidance — the AI nutritionist is unreachable, so here is your plan read from your own numbers.`,
    question.trim() ? `On "${question.trim().slice(0, 120)}": hold the targets first, swap ingredients second.` : "",
    ``,
    `Goal: ${goal}. Daily targets: ${ctx.kcal} kcal · ${ctx.protein}g protein · ${ctx.carbs}g carbs · ${ctx.fat}g fat · ${ctx.water}ml water.`,
    meals.length
      ? `Today's plan covers ${Math.round(logged.kcal)} kcal and ${Math.round(logged.protein)}g protein — ${gap(ctx.protein, logged.protein)}g protein and ${gap(ctx.kcal, logged.kcal)} kcal still to go.`
      : `No plan built yet. Structure four meals at roughly ${Math.round(ctx.kcal / 4)} kcal and ${perMealProtein}g protein each.`,
    ``,
    `Standards to hold:`,
    `1. ${perMealProtein}g protein per meal — chicken breast, lean beef, white fish, eggs or Greek yoghurt.`,
    `2. State weights as raw unless the meal says cooked; rice and pasta roughly double in weight once cooked.`,
    `3. Keep carbs around your training window; fats fill the remainder of the calorie budget.`,
    `4. Drink ${Math.round(ctx.water / Math.max(1, meals.length || 4))}ml with each meal to reach ${ctx.water}ml.`,
    ``,
    `Swaps stay 1:1 on protein and within ±5% on calories. For medical concerns, consult a qualified professional.`,
  ]
    .filter(Boolean)
    .join("\n");
}

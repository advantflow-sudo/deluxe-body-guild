import Stripe from "stripe";

let _stripe: Stripe | undefined;
export function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

// Tier configuration — prices in GBP pence.
// Annual Essential/Signature ≈ two months free vs monthly.
// Private is invitation-only: no public Stripe checkout until human coaching,
// direct coach access and concierge services are genuinely operational.
export const TIER_CONFIG = {
  essential: {
    name: "Essential",
    monthly: 1499,
    yearly: 14999,
    checkoutEnabled: true,
  },
  signature: {
    name: "Signature",
    monthly: 3999,
    yearly: 39999,
    checkoutEnabled: true,
  },
  private: {
    name: "Private",
    monthly: 11999,
    yearly: null,
    checkoutEnabled: false,
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;
export type Cycle = "monthly" | "yearly";

/** Tier granted by redeeming the 30-day points membership reward (no subscription). */
export const POINTS_REWARD_TIER = "signature" as const;


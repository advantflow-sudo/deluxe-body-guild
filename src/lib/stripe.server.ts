import Stripe from "stripe";

let _stripe: Stripe | undefined;
export function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

// Tier configuration — prices in GBP pence
export const TIER_CONFIG = {
  essential: {
    name: "Essential",
    monthly: 2900,
    yearly: 27600, // £23 × 12
  },
  signature: {
    name: "Signature",
    monthly: 7900,
    yearly: 75600, // £63 × 12
  },
  private: {
    name: "Private",
    monthly: 24900,
    yearly: 238800, // £199 × 12
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;
export type Cycle = "monthly" | "yearly";

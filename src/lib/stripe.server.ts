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
    monthly: 1499,
    yearly: 14388, // £11.99 × 12
  },
  signature: {
    name: "Signature",
    monthly: 3999,
    yearly: 38388, // £31.99 × 12
  },
  private: {
    name: "Private",
    monthly: 11999,
    yearly: 115188, // £95.99 × 12
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;
export type Cycle = "monthly" | "yearly";

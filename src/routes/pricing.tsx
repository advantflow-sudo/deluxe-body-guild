import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Crown, Sparkles, Star, Flame, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, GoldDivider, SectionLabel } from "@/components/deluxe/ui";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Membership & Pricing — Deluxe Fitness" },
      {
        name: "description",
        content:
          "Choose a Deluxe Fitness membership: Essential, Signature, or Private. Personalized programming, AI coaching, and an elevated community.",
      },
      { property: "og:title", content: "Membership & Pricing — Deluxe Fitness" },
      {
        property: "og:description",
        content:
          "Three tiers of transformation. Essential, Signature, and Private memberships built for serious results.",
      },
      { property: "og:url", content: "https://deluxefitness.app/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Can I cancel anytime?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Memberships are month-to-month or annual. Cancel from your dashboard in two clicks — no questions, no friction." } },
            { "@type": "Question", name: "Is there a free trial?", acceptedAnswer: { "@type": "Answer", text: "Every new member gets a 7-day complimentary trial on Essential and Signature. Cancel before day seven and you won't be charged." } },
            { "@type": "Question", name: "How is Private different?", acceptedAnswer: { "@type": "Answer", text: "Private is an invitation-only tier capped each quarter. You work directly with a senior coach with full bespoke programming and concierge support." } },
            { "@type": "Question", name: "Do you offer corporate or team plans?", acceptedAnswer: { "@type": "Answer", text: "Yes — bespoke packages for teams of 5+ with shared dashboards and consolidated billing. Reach out via the contact page." } },
          ],
        }),
      },
    ],
  }),
  component: PricingPage,
});

type Cycle = "monthly" | "yearly";

const TIERS = [
  {
    name: "Essential",
    icon: Star,
    tagline: "Begin the discipline.",
    monthly: 14.99,
    yearly: 11.99,
    features: [
      "Full library of guided workouts",
      "Weekly fitness & wellbeing plan",
      "AI Coach — 20 conversations / month",
      "Progress tracking & streaks",
      "Community access",
    ],
    cta: "Start Essential",
    featured: false,
  },
  {
    name: "Signature",
    icon: Crown,
    tagline: "The Deluxe standard.",
    monthly: 39.99,
    yearly: 31.99,
    features: [
      "Everything in Essential",
      "Personalized 12-week programming",
      "Unlimited AI Coach conversations",
      "Nutrition & macro planner",
      "Monthly form-check video review",
      "Priority community & live events",
    ],
    cta: "Join Signature",
    featured: true,
  },
  {
    name: "Private",
    icon: Sparkles,
    tagline: "By invitation. Limitless.",
    monthly: 119.99,
    yearly: 95.99,
    features: [
      "Everything in Signature",
      "1:1 coaching — 2 sessions / month",
      "Bespoke nutrition protocol",
      "Direct line to your coach",
      "Quarterly strategy review",
      "Concierge scheduling",
    ],
    cta: "Apply Privately",
    featured: false,
  },
] as const;

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Memberships are month-to-month or annual. Cancel from your dashboard in two clicks — no questions, no friction.",
  },
  {
    q: "Is there a free trial?",
    a: "Every new member gets a 7-day complimentary trial on Essential and Signature. Cancel before day seven and you won't be charged.",
  },
  {
    q: "How is Private different?",
    a: "Private is an invitation-only tier capped each quarter. You work directly with a senior coach with full bespoke programming and concierge support.",
  },
  {
    q: "Do you offer corporate or team plans?",
    a: "Yes — bespoke packages for teams of 5+ with shared dashboards and consolidated billing. Reach out via the contact page.",
  },
];

function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscribers")
      .select("tier,status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tier && (data.status === "active" || data.status === "trialing")) {
          setCurrentTier(data.tier);
        }
      });
  }, [user]);

  const tierRank: Record<string, number> = { essential: 1, signature: 2, private: 3 };

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { createPortalSession } = await import("@/lib/stripe.functions");
      const res = await createPortalSession({ data: { origin: window.location.origin } });
      if (res?.url) window.location.href = res.url;
    } catch (e) {
      alert("Could not open billing portal: " + (e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  async function subscribe(tierName: string) {
    const tierKey = tierName.toLowerCase() as "essential" | "signature" | "private";
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/pricing" } as never });
      return;
    }
    // If they already have an active/trialing plan, route through the customer portal to change it
    if (currentTier && currentTier !== tierKey) {
      await openPortal();
      return;
    }
    setLoadingTier(tierName);
    try {
      const { createCheckoutSession } = await import("@/lib/stripe.functions");
      const res = await createCheckoutSession({
        data: { tier: tierKey, cycle, origin: window.location.origin },
      });
      if (res?.url) window.location.href = res.url;
    } catch (e) {
      alert("Could not start checkout: " + (e as Error).message);
    } finally {
      setLoadingTier(null);
    }
  }



  return (
    <PageShell>
      <PageHero
        eyebrow="Membership"
        title="Invest in"
        highlight="the deluxe version of you."
        body="Three tiers, one philosophy: discipline, transformation, and an experience worthy of your standards."
      />

      <section className="relative bg-deluxe-black py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Trial urgency banner */}
          <div className="mb-10 overflow-hidden border border-gold/40 bg-gold-gradient/10">
            <div className="flex flex-col items-center gap-4 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-3">
                <Flame className="h-6 w-6 shrink-0 text-gold" />
                <div>
                  <div className="font-display text-lg text-foreground">
                    7-day free trial — no card required for the first 24 hours.
                  </div>
                  <div className="mt-0.5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-gold sm:justify-start">
                    <Clock className="h-3 w-3" />
                    Founding-member pricing ends this month
                  </div>
                </div>
              </div>
              <Link to="/login">
                <GoldButton>Start free trial</GoldButton>
              </Link>
            </div>
          </div>

          <div className="mb-14 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-deluxe-forest/40 p-1">
              {(["monthly", "yearly"] as Cycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`relative rounded-full px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    cycle === c
                      ? "bg-gold-gradient text-deluxe-black"
                      : "text-muted-foreground hover:text-gold"
                  }`}
                >
                  {c === "monthly" ? "Monthly" : "Yearly"}
                  {c === "yearly" && cycle === "yearly" && (
                    <span className="ml-2 text-[9px] opacity-80">— save 20%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current plan / change plan banner */}
          {currentTier && (
            <div className="mb-8 border border-gold/40 bg-deluxe-forest/40 p-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-gold" />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Your current plan</div>
                    <div className="font-display text-lg capitalize text-foreground">{currentTier}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground sm:max-w-md sm:text-right">
                  Upgrades take effect immediately with prorated billing. Downgrades apply at the end of your current period. Manage everything from your billing portal.
                </div>
                <button onClick={openPortal} disabled={portalLoading}>
                  <OutlineButton className="!px-5 !py-2 !text-[10px]">
                    {portalLoading ? "Opening…" : "Manage billing"}
                  </OutlineButton>
                </button>
              </div>
            </div>
          )}

          {/* Tiers */}
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const price = cycle === "monthly" ? tier.monthly : tier.yearly;
              const tierKey = tier.name.toLowerCase();
              const isCurrent = currentTier === tierKey;
              const currentRank = currentTier ? tierRank[currentTier] ?? 0 : 0;
              const thisRank = tierRank[tierKey] ?? 0;
              const isUpgrade = currentTier && thisRank > currentRank;
              const isDowngrade = currentTier && thisRank < currentRank;
              let ctaLabel: string = tier.cta;
              if (isCurrent) ctaLabel = "Current plan";
              else if (isUpgrade) ctaLabel = "Upgrade";
              else if (isDowngrade) ctaLabel = "Downgrade";

              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col border bg-deluxe-forest/30 p-8 backdrop-blur-sm transition hover:bg-deluxe-forest/50 ${
                    isCurrent
                      ? "border-gold ring-1 ring-gold/40"
                      : tier.featured
                      ? "border-gold/70 shadow-[0_0_60px_-20px_rgba(201,162,76,0.4)] lg:-mt-4 lg:mb-4"
                      : "border-gold/20"
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gold-gradient px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-deluxe-black">
                        Your Plan
                      </span>
                    </div>
                  ) : tier.featured ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gold-gradient px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-deluxe-black">
                        Most Chosen
                      </span>
                    </div>
                  ) : null}

                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>

                  <h2 className="font-display text-2xl text-foreground">{tier.name}</h2>
                  <p className="mt-1 font-serif italic text-muted-foreground">{tier.tagline}</p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-gold-gradient font-display text-5xl">£{price}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      / month
                    </span>
                  </div>
                  {cycle === "yearly" && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Billed annually — £{price * 12}
                    </p>
                  )}

                  {currentTier && !isCurrent && (
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-gold">
                      {isUpgrade ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isUpgrade
                        ? "Prorated instantly via portal"
                        : "Applies at end of period"}
                    </p>
                  )}

                  <div className="my-6">
                    <GoldDivider />
                  </div>

                  <ul className="flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-foreground/85">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => subscribe(tier.name)}
                    className="mt-8 block w-full"
                    disabled={loadingTier === tier.name || isCurrent || portalLoading}
                  >
                    {tier.featured && !isCurrent ? (
                      <GoldButton className="w-full">
                        {loadingTier === tier.name ? "Loading…" : ctaLabel}
                      </GoldButton>
                    ) : (
                      <OutlineButton className="w-full">
                        {loadingTier === tier.name ? "Loading…" : ctaLabel}
                      </OutlineButton>
                    )}
                  </button>
                </div>
              );
            })}
          </div>



          {/* Guarantee */}
          <div className="mx-auto mt-16 max-w-2xl border border-gold/20 bg-deluxe-forest/20 p-8 text-center">
            <SectionLabel>The Deluxe Guarantee</SectionLabel>
            <p className="mt-4 font-serif text-lg italic text-foreground/90">
              Train with us for 30 days. If you don't feel transformed in body, mind, and standard
              — we'll refund every penny.
            </p>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="border-y border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionLabel>Why Deluxe</SectionLabel>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            More than a gym. <span className="text-gold-gradient italic font-serif">A standard.</span>
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { k: "12wk", v: "Average member transformation timeline" },
              { k: "98%", v: "Member satisfaction rating" },
              { k: "24/7", v: "AI Coach + community on demand" },
            ].map((s) => (
              <div key={s.k} className="border border-gold/15 bg-deluxe-forest/20 p-6">
                <div className="text-gold-gradient font-display text-4xl">{s.k}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              Answers, <span className="text-gold-gradient italic font-serif">always.</span>
            </h2>
          </div>
          <div className="mt-12 space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group border border-gold/20 bg-deluxe-forest/30 p-6 transition hover:border-gold/40"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                  {f.q}
                  <span className="text-gold transition group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="mt-4 font-serif text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

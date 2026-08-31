import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Trophy, Sparkles, Dumbbell, Shirt, Ticket, Crown, ArrowRight } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";
import ogImage from "@/assets/og-membership.jpg";

export const Route = createFileRoute("/rewards-benefits")({
  head: () => ({
    meta: [
      { title: "Rewards & Benefits — Deluxe Fitness" },
      { name: "description", content: "Earn 50 points for every guided workout you finish, then redeem them for partner discounts, Deluxe kit, coaching calls or Premium months." },
      { property: "og:title", content: "Deluxe Fitness Rewards" },
      { property: "og:description", content: "Discipline pays. Tangible rewards for showing up." },
      { property: "og:url", content: "https://deluxefitness.app/rewards-benefits" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: `https://deluxefitness.app${ogImage}` },
      { name: "twitter:image", content: `https://deluxefitness.app${ogImage}` },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/rewards-benefits" }],
  }),
  component: RewardsPage,
});

/** Live earning rule — this mirrors what the app actually awards today. */
const EARN = [
  { what: "Complete a guided workout session", pts: 50 },
];

/** Live catalogue items members can redeem today. */
const REWARDS = [
  { Icon: Ticket, name: "£10 Gymshark Discount", body: "Partner discount code.", cost: "500 pts" },
  { Icon: Sparkles, name: "20% Off Supplement Stack", body: "Partner supplement discount.", cost: "700 pts" },
  { Icon: Shirt, name: "Deluxe Training Tee", body: "Members-only training tee.", cost: "1,500 pts" },
  { Icon: Dumbbell, name: "Free 1:1 Coaching Call", body: "A live call with a Deluxe coach.", cost: "2,000 pts" },
  { Icon: Trophy, name: "Members Night Invitation", body: "Invite to a Deluxe members event.", cost: "2,500 pts" },
  { Icon: Crown, name: "Signature Membership — 1 Month", body: "One month of Signature access, on points. No subscription is created.", cost: "3,500 pts" },
];

function RewardsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Rewards & Benefits"
        title="Discipline"
        highlight="pays."
        body="Every workout, streak and challenge earns points. Redeem them for things you actually want."
      />

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <SectionLabel>How you earn</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">Show up. <span className="text-gold-gradient italic font-serif">Stack points.</span></h2>
            <div className="mt-6 flex justify-center"><GoldDivider /></div>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-2">
            {EARN.map((e) => (
              <div key={e.what} className="flex items-center justify-between border border-gold/20 bg-deluxe-card p-5">
                <span className="text-sm text-foreground">{e.what}</span>
                <span className="font-display text-lg text-gold tabular-nums">+{e.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gold/15 bg-deluxe-dark py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <SectionLabel>What you can redeem</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">The <span className="text-gold-gradient italic font-serif">rewards marketplace.</span></h2>
            <div className="mt-6 flex justify-center"><GoldDivider /></div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {REWARDS.map(({ Icon, name, body, cost }) => (
              <div key={name} className="luxury-card p-7">
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
                <h3 className="mt-5 font-display text-xl text-foreground">{name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                <div className="mt-5 border-t border-gold/15 pt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {cost}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deluxe-black py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Gift className="mx-auto h-8 w-8 text-gold" strokeWidth={1.5} />
          <h2 className="mt-6 font-display text-3xl sm:text-4xl">Start earning today.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every member starts with 100 welcome points. Your first workout adds 50.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login"><GoldButton>Join Deluxe <ArrowRight className="h-4 w-4" /></GoldButton></Link>
            <Link to="/pricing"><OutlineButton>See pricing</OutlineButton></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

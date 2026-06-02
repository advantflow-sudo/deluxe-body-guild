import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Trophy, Sparkles, Dumbbell, Shirt, Ticket, Crown, ArrowRight } from "lucide-react";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { GoldButton, OutlineButton, SectionLabel, GoldDivider } from "@/components/deluxe/ui";

export const Route = createFileRoute("/rewards-benefits")({
  head: () => ({
    meta: [
      { title: "Rewards & Benefits — Deluxe Fitness" },
      { name: "description", content: "Earn points for every workout, streak and challenge. Redeem for gym discounts, supplements, gear, prize draws and exclusive experiences." },
      { property: "og:title", content: "Deluxe Fitness Rewards" },
      { property: "og:description", content: "Discipline pays. Tangible rewards for showing up." },
      { property: "og:url", content: "https://deluxefitness.app/rewards-benefits" },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/rewards-benefits" }],
  }),
  component: RewardsPage,
});

const EARN = [
  { what: "Complete a workout", pts: 50 },
  { what: "Hit your daily Deluxe Score (80+)", pts: 30 },
  { what: "7-day streak", pts: 100 },
  { what: "30-day challenge complete", pts: 500 },
  { what: "75-day discipline challenge", pts: 1500 },
  { what: "Refer a friend who joins", pts: 250 },
];

const REWARDS = [
  { Icon: Dumbbell, name: "Gym Discounts", body: "Up to 30% off partner gyms across the UK.", cost: "500 pts" },
  { Icon: Sparkles, name: "Supplement Discounts", body: "Premium protein, creatine, hydration mixes.", cost: "300 pts" },
  { Icon: Shirt, name: "Deluxe Apparel", body: "Members-only training gear, drops monthly.", cost: "1,000 pts" },
  { Icon: Ticket, name: "Prize Draws", body: "Apple Watch, Whoop, Theragun, weekend retreats.", cost: "100 pts / entry" },
  { Icon: Crown, name: "Exclusive Experiences", body: "Private coaching weekends. Founders dinners.", cost: "5,000 pts" },
  { Icon: Trophy, name: "Lifetime Tier Upgrades", body: "Unlock Deluxe-tier perks forever.", cost: "10,000 pts" },
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

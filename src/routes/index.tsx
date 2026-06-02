import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Dumbbell,
  UtensilsCrossed,
  Users,
  TrendingUp,
  Gift,
  Brain,
  Sparkles,
  Award,
  Activity,
  Heart,
  Play,
  ArrowRight,
  Flame,
  Star,
  Quote,
  Apple as AppleIcon,
  Trophy,
  Medal,
  Crown,
  Zap,
  Download,
  ClipboardCheck,
  Wand2,
  Target,
  Droplet,
  Footprints,
  BookOpen,
  MessageCircle,
  Moon,
  Salad,
  CheckCircle2,
  Lock,
} from "lucide-react";

import { Header } from "@/components/deluxe/Header";
import { Footer } from "@/components/deluxe/Footer";
import {
  GoldButton,
  OutlineButton,
  SectionLabel,
  GoldDivider,
} from "@/components/deluxe/ui";
import heroImg from "@/assets/hero.jpg";
import workout1 from "@/assets/workout-1.jpg";
import workout2 from "@/assets/workout-2.jpg";
import workout3 from "@/assets/workout-3.jpg";
import communityImg from "@/assets/community.jpg";
import { Reveal } from "@/components/deluxe/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deluxe Fitness — Discipline. Transform. Become Deluxe." },
      {
        name: "description",
        content:
          "More than fitness. It's a lifestyle. Premium workouts, AI coaching, nutrition tracking and an elite community for people who demand more.",
      },
      { property: "og:title", content: "Deluxe Fitness — Become Deluxe" },
      {
        property: "og:description",
        content:
          "Transform your body. Elevate your life. Join 50,000+ members on the Deluxe Fitness journey.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-deluxe-black text-foreground">
      <Header />
      <Hero />
      <HowItWorks />
      <DeluxeLifestyle />
      <Mission />
      <FeatureIcons />
      <TodaysMissionPreview />
      <DeluxeScore />
      <WhyDeluxe />
      <WhyDifferent />
      <AppPreview />
      <Community />
      <Rewards />
      <Reviews />
      <TransformationGallery />
      <TaglineCascade />
      <FinalCta />
      <Footer />
    </div>
  );
}


/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-deluxe-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-deluxe-black/75 via-deluxe-black/60 to-deluxe-black" />
      <div className="gold-glow absolute inset-x-0 bottom-0 h-[60%]" />
      <span className="gold-orb left-[-10%] top-[10%] h-[420px] w-[420px]" />
      <span className="gold-orb gold-orb-slow right-[-8%] top-[30%] h-[520px] w-[520px]" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <Reveal>
          <SectionLabel>Welcome to the future of fitness</SectionLabel>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-8xl lg:text-9xl">
            TRANSFORM
            <br />
            YOUR BODY.
            <br />
            <span className="text-gold-shimmer">ELEVATE YOUR LIFE.</span>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-8 flex justify-center">
            <GoldDivider />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            More than fitness. More than motivation. This is a lifestyle built on
            discipline, elevation, and transformation — for people who demand more
            from themselves.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login">
              <GoldButton>
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </GoldButton>
            </Link>
            <Link to="/about">
              <OutlineButton>
                <Play className="h-3.5 w-3.5" /> Watch the Story
              </OutlineButton>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
            {[
              ["50K+", "Members"],
              ["500+", "Workouts"],
              ["4.9★", "App Rating"],
            ].map(([v, l], i, arr) => (
              <div key={l} className="flex items-center gap-x-10 sm:gap-x-14">
                <div className="text-center">
                  <div className="font-display text-3xl text-gold sm:text-4xl">{v}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {l}
                  </div>
                </div>
                {i < arr.length - 1 && <span className="hidden h-10 w-px bg-gold/30 sm:block" />}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Mission ---------------- */
function Mission() {
  return (
    <section className="bg-deluxe-dark py-28">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <SectionLabel>Our Mission</SectionLabel>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          IT'S NOT JUST AN APP. <br />
          <span className="text-gold">
            IT'S A NEW WAY OF CONNECTING PEOPLE.
          </span>
        </h2>
        <div className="mt-8 flex justify-center">
          <GoldDivider />
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            Deluxe Fitness was created for people who want more from themselves
            — mentally, physically, and in every area of life. Whether your goal
            is fat loss, muscle building, confidence, consistency, or simply
            becoming the strongest version of yourself, this platform is
            designed to push you forward every single day.
          </p>
          <p>
            Every workout completed. Every streak maintained. Every goal
            achieved. It all builds the person you're becoming.{" "}
            <span className="text-foreground">
              This is not just an app. This is a movement.
            </span>
          </p>
        </div>

        <div className="mx-auto mt-14 inline-block max-w-full border border-gold/40 px-5 py-5 sm:px-10 sm:py-6">
          <p className="font-display text-base tracking-[0.18em] text-gold sm:text-2xl sm:tracking-[0.25em] md:text-3xl">
            DISCIPLINE. TRANSFORM. BECOME DELUXE.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Feature Icons ---------------- */
function FeatureIcons() {
  const items = [
    { Icon: Dumbbell, title: "Workouts", sub: "For all levels" },
    { Icon: UtensilsCrossed, title: "Nutrition", sub: "Track calories" },
    { Icon: Users, title: "Community", sub: "Connect & grow" },
    { Icon: TrendingUp, title: "Progress", sub: "Track results" },
    { Icon: Gift, title: "Rewards", sub: "Unlock benefits" },
  ];
  return (
    <section className="border-y border-gold/15 bg-deluxe-black py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 sm:grid-cols-3 md:grid-cols-5">
        {items.map(({ Icon, title, sub }) => (
          <div key={title} className="text-center">
            <Icon className="mx-auto h-8 w-8 text-gold" strokeWidth={1.5} />
            <div className="mt-4 font-display text-xl tracking-[0.18em] text-foreground">
              {title.toUpperCase()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Why Deluxe ---------------- */
function WhyDeluxe() {
  const features = [
    {
      Icon: Sparkles,
      title: "Smart Workouts",
      body: "AI-personalised routines built around your level, equipment, and goals.",
    },
    {
      Icon: Users,
      title: "Elite Community",
      body: "Connect, share progress, and motivate each other inside a private, members-only feed.",
    },
    {
      Icon: TrendingUp,
      title: "Progress Tracking",
      body: "Weight, calories, streaks and body stats — visualised on premium dark charts.",
    },
    {
      Icon: Brain,
      title: "AI Coach",
      body: "24/7 personalised guidance, form tips, and discipline-led motivation.",
    },
    {
      Icon: Award,
      title: "Rewards System",
      body: "Badges, benefits and leaderboard placement for those who keep showing up.",
    },
    {
      Icon: UtensilsCrossed,
      title: "Nutrition",
      body: "Calories, macros and hydration goals tracked with effortless precision.",
    },
  ];
  return (
    <section className="bg-deluxe-dark py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>Why Deluxe Fitness</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            BUILT FOR THOSE WHO <span className="text-gold">DEMAND MORE.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="luxury-card group relative overflow-hidden p-8 transition hover:border-gold/40"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gold" />
              <Icon className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-2xl tracking-wide text-foreground">
                {title.toUpperCase()}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- App Preview ---------------- */
function AppPreview() {
  const screens = [
    { img: workout1, label: "Dashboard" },
    { img: workout2, label: "Workouts" },
    { img: workout3, label: "Progress" },
    { img: communityImg, label: "Community" },
  ];
  return (
    <section className="bg-deluxe-black py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <SectionLabel>App Screen Concepts</SectionLabel>
        <h2 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          DESIGNED FOR <span className="text-gold">EVERY DAY YOU SHOW UP.</span>
        </h2>
        <div className="mt-6 flex justify-center">
          <GoldDivider />
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {screens.map(({ img, label }) => (
            <div key={label} className="group">
              <div className="overflow-hidden rounded-[28px] border border-gold/20 bg-deluxe-card p-2 shadow-[0_30px_60px_-30px_rgba(212,175,55,0.25)]">
                <div className="aspect-[9/19] overflow-hidden rounded-[20px] bg-deluxe-dark">
                  <img
                    src={img}
                    alt={`${label} screen`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Community ---------------- */
function Community() {
  const items = [
    {
      Icon: Users,
      title: "Connect",
      body: "Find like-minded fitness partners on the same journey.",
    },
    {
      Icon: Activity,
      title: "Share",
      body: "Share progress, lifts and wins. Motivate others to push harder.",
    },
    {
      Icon: Heart,
      title: "Support",
      body: "Grow together. Stay accountable. Become unstoppable.",
    },
  ];
  return (
    <section className="relative overflow-hidden bg-deluxe-dark py-28">
      <img
        src={communityImg}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-deluxe-dark via-deluxe-dark/85 to-deluxe-dark" />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <SectionLabel>The Movement</SectionLabel>
        <h2 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          CONNECT. MOTIVATE. <span className="text-gold">ACHIEVE.</span>
        </h2>
        <p className="mt-6 text-base text-muted-foreground md:text-lg">
          Welcome to the Deluxe Community.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map(({ Icon, title, body }) => (
            <div key={title} className="luxury-card p-8 text-left">
              <Icon className="h-7 w-7 text-gold" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-2xl tracking-[0.15em] text-foreground">
                {title.toUpperCase()}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Tagline Cascade ---------------- */
function TaglineCascade() {
  return (
    <section className="bg-deluxe-black py-32">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="font-display text-lg tracking-[0.15em] text-foreground/25 sm:text-3xl sm:tracking-[0.2em] md:text-4xl">
          DISCIPLINE TODAY. DELUXE FOREVER.
        </p>
        <p className="mt-6 font-display text-xl tracking-[0.15em] text-foreground/55 sm:text-4xl sm:tracking-[0.2em] md:text-5xl">
          BUILT IN THE GYM. ELEVATED IN LIFE.
        </p>
        <p className="mt-6 font-display text-2xl tracking-[0.15em] text-gold sm:text-5xl sm:tracking-[0.2em] md:text-7xl">
          MORE THAN FITNESS.
          <br /> IT'S A LIFESTYLE.
        </p>
      </div>
    </section>
  );
}

/* ---------------- Rewards ---------------- */
function Rewards() {
  const tiers = [
    {
      Icon: Medal,
      name: "Bronze",
      threshold: "10 workouts",
      perk: "Members-only workout drops & badge.",
    },
    {
      Icon: Trophy,
      name: "Gold",
      threshold: "50 workouts",
      perk: "AI Coach priority, gear discounts, leaderboard placement.",
      featured: true,
    },
    {
      Icon: Crown,
      name: "Deluxe",
      threshold: "200 workouts",
      perk: "1:1 quarterly review, exclusive retreats, lifetime status.",
    },
  ];
  return (
    <section className="border-y border-gold/15 bg-deluxe-black py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>Rewards System</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            DISCIPLINE <span className="text-gold">PAYS.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <GoldDivider />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Every session, streak and milestone unlocks tangible benefits. The
            more you show up, the more Deluxe gives back.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map(({ Icon, name, threshold, perk, featured }) => (
            <div
              key={name}
              className={`luxury-card relative p-8 transition ${
                featured
                  ? "border-gold/60 shadow-[0_30px_60px_-30px_rgba(212,175,55,0.45)]"
                  : "hover:border-gold/40"
              }`}
            >
              {featured && (
                <span className="absolute right-6 top-6 border border-gold/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                  Most Earned
                </span>
              )}
              <Icon className="h-9 w-9 text-gold" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-3xl tracking-[0.15em] text-foreground">
                {name.toUpperCase()}
              </h3>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {threshold}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {perk}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Transformation Gallery (Founding Members) ---------------- */
function TransformationGallery() {
  const slots = [
    { focus: "Fat loss" },
    { focus: "Muscle gain" },
    { focus: "Confidence" },
    { focus: "Lifestyle" },
  ];
  return (
    <section className="bg-deluxe-dark py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>Transformation Gallery</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            FOUNDING MEMBERS. <span className="text-gold">YOUR FACE HERE.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <GoldDivider />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            We're selecting our first cohort of Founding Members. The first 100 to commit
            and complete a 90-day transformation will be featured here — story, stats, and all.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((s, i) => (
            <div
              key={s.focus}
              className="group relative aspect-[3/4] overflow-hidden border border-gold/25 bg-gradient-to-br from-deluxe-card to-deluxe-black p-6 transition hover:border-gold/60"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Lock className="h-4 w-4 text-gold/60" strokeWidth={1.5} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gold/80">
                    Slot {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Focus
                  </div>
                  <div className="mt-1 font-display text-2xl text-foreground">
                    {s.focus}
                  </div>
                  <div className="mt-4 h-px w-12 bg-gold/40" />
                  <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                    Reserved for a founding member
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/transformations">
            <GoldButton>
              Claim a founding spot <ArrowRight className="h-4 w-4" />
            </GoldButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-base text-gold">{value}</dd>
    </div>
  );
}


/* ---------------- Why We're Different ---------------- */
function WhyDifferent() {
  const rows = [
    { feature: "Personalized AI coach with memory", deluxe: true, mfp: false, nike: false, fitbod: false, yt: false },
    { feature: "Discipline-led tier progression", deluxe: true, mfp: false, nike: false, fitbod: false, yt: false },
    { feature: "Tangible rewards (gear, coaching, events)", deluxe: true, mfp: false, nike: false, fitbod: false, yt: false },
    { feature: "Workouts + nutrition + community", deluxe: true, mfp: "partial", nike: false, fitbod: false, yt: false },
    { feature: "Members-only transformation community", deluxe: true, mfp: false, nike: "partial", fitbod: false, yt: false },
    { feature: "Built around identity, not just exercise", deluxe: true, mfp: false, nike: false, fitbod: false, yt: false },
    { feature: "Strength programming for all levels", deluxe: true, mfp: false, nike: true, fitbod: true, yt: "partial" },
    { feature: "Calorie & macro tracking", deluxe: true, mfp: true, nike: false, fitbod: false, yt: false },
  ] as const;

  const cell = (v: boolean | "partial") =>
    v === true ? (
      <span className="text-gold">●</span>
    ) : v === "partial" ? (
      <span className="text-gold/40">◐</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  return (
    <section className="border-y border-gold/15 bg-deluxe-black py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <SectionLabel>Why We're Different</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            DELUXE VS <span className="text-gold">EVERYTHING ELSE.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <GoldDivider />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            MyFitnessPal tracks. Nike trains. Fitbod programs. YouTube entertains.
            <br className="hidden sm:block" />
            Deluxe makes you become someone new.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-gold/30 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <th className="py-4 text-left">Feature</th>
                <th className="py-4 text-center text-gold">Deluxe</th>
                <th className="py-4 text-center">MyFitnessPal</th>
                <th className="py-4 text-center">Nike Training</th>
                <th className="py-4 text-center">Fitbod</th>
                <th className="py-4 text-center">YouTube</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature} className="border-b border-gold/10 text-sm">
                  <td className="py-4 pr-4 text-foreground">{r.feature}</td>
                  <td className="py-4 text-center text-lg">{cell(r.deluxe)}</td>
                  <td className="py-4 text-center text-lg">{cell(r.mfp)}</td>
                  <td className="py-4 text-center text-lg">{cell(r.nike)}</td>
                  <td className="py-4 text-center text-lg">{cell(r.fitbod)}</td>
                  <td className="py-4 text-center text-lg">{cell(r.yt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-gold/15 bg-deluxe-dark py-28">
      <div className="gold-glow absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Flame className="mx-auto h-8 w-8 text-gold" strokeWidth={1.5} />
        <h2 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-7xl">
          BUILD THE BODY. <br />
          <span className="text-gold">MASTER THE MIND.</span>
        </h2>
        <div className="mt-8 flex justify-center">
          <GoldDivider />
        </div>
        <p className="mt-8 text-base text-muted-foreground md:text-lg">
          Join 50,000+ members already on their journey.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/login">
            <GoldButton>
              <AppleIcon className="h-4 w-4" /> Download on iOS
            </GoldButton>
          </Link>
          <Link to="/login">
            <GoldButton>
              <Play className="h-4 w-4" /> Get it on Android
            </GoldButton>
          </Link>
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Free to download · Premium plans available
        </p>
      </div>
    </section>
  );
}

/* ---------------- Reviews ---------------- */
function Reviews() {
  const reviews = [
    {
      name: "Alexandra J.",
      role: "Member · 14 months",
      body: "I've tried every fitness app out there. Nothing has made me show up like Deluxe. The community alone is worth it.",
    },
    {
      name: "James O.",
      role: "Member · 8 months",
      body: "Down 12kg, up two suit sizes in the shoulders. The AI coach actually feels like a real PT.",
    },
    {
      name: "Maya R.",
      role: "Member · 2 years",
      body: "It stopped feeling like an app and started feeling like a lifestyle. Genuinely changed how I move through my day.",
    },
  ];
  return (
    <section className="bg-deluxe-black py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>Reviews &amp; Referrals</SectionLabel>
          <h2 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            STORIES FROM <span className="text-gold">THE FLOOR.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <GoldDivider />
          </div>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="luxury-card p-8">
              <Quote className="h-6 w-6 text-gold" strokeWidth={1.5} />
              <blockquote className="mt-5 text-base leading-relaxed text-foreground/90">
                "{r.body}"
              </blockquote>
              <div className="mt-6 flex items-center justify-between border-t border-gold/10 pt-5">
                <figcaption>
                  <div className="font-display text-lg tracking-wide text-foreground">
                    {r.name.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </figcaption>
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold" />
                  ))}
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- How It Works ---------------- */
function HowItWorks() {
  const steps = [
    { Icon: Download, title: "Download", body: "Grab Deluxe Fitness on iOS or Android. Sign up in under a minute." },
    { Icon: ClipboardCheck, title: "Assess", body: "Complete your fitness, lifestyle and mindset assessment." },
    { Icon: Wand2, title: "Receive Your Plan", body: "Get an AI-powered training, nutrition and recovery plan tuned to you." },
    { Icon: TrendingUp, title: "Track & Earn", body: "Log workouts, hit habits, build streaks. Earn points and rewards." },
    { Icon: Users, title: "Join the Movement", body: "Connect with members, accountability partners and live challenges." },
  ];
  return (
    <section className="border-y border-gold/15 bg-deluxe-black py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            FIVE STEPS. <span className="text-gold">ONE TRANSFORMATION.</span>
          </h2>
          <div className="mt-6 flex justify-center"><GoldDivider /></div>
        </div>
        <ol className="mt-16 grid gap-4 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative border border-gold/20 bg-deluxe-card p-6 transition hover:border-gold/50">
              <span className="absolute -top-3 left-6 bg-deluxe-black px-2 font-display text-xs tracking-[0.3em] text-gold">
                STEP {String(i + 1).padStart(2, "0")}
              </span>
              <s.Icon className="mt-3 h-7 w-7 text-gold" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-xl tracking-wide text-foreground">{s.title.toUpperCase()}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center">
          <Link to="/how-it-works">
            <OutlineButton>See the full journey <ArrowRight className="h-4 w-4" /></OutlineButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Deluxe Lifestyle (reframe) ---------------- */
function DeluxeLifestyle() {
  const pillars = [
    { Icon: Dumbbell, label: "Fitness" },
    { Icon: Heart, label: "Health" },
    { Icon: Brain, label: "Mindset" },
    { Icon: Flame, label: "Discipline" },
    { Icon: Users, label: "Community" },
    { Icon: Sparkles, label: "Growth" },
  ];
  return (
    <section className="relative overflow-hidden bg-deluxe-dark py-28">
      <div className="gold-glow absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <SectionLabel>The Deluxe Lifestyle</SectionLabel>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
          NOT ANOTHER FITNESS APP. <br />
          <span className="text-gold-shimmer">A LUXURY SELF-IMPROVEMENT ECOSYSTEM.</span>
        </h2>
        <div className="mt-6 flex justify-center"><GoldDivider /></div>
        <p className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          You're not downloading another workout tracker. You're joining a movement built around
          six pillars that compound into the deluxe version of you.
        </p>
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {pillars.map(({ Icon, label }) => (
            <div key={label} className="border border-gold/20 bg-deluxe-black/40 p-6 transition hover:border-gold/50">
              <Icon className="mx-auto h-6 w-6 text-gold" strokeWidth={1.5} />
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Today's Mission Preview ---------------- */
function TodaysMissionPreview() {
  const tasks = [
    { Icon: Droplet, label: "Drink 3L water", progress: 66 },
    { Icon: Footprints, label: "Walk 8,000 steps", progress: 80 },
    { Icon: Dumbbell, label: "Complete workout", progress: 100, done: true },
    { Icon: BookOpen, label: "Read 10 pages", progress: 40 },
    { Icon: MessageCircle, label: "Check in with the community", progress: 0 },
  ];
  return (
    <section className="bg-deluxe-black py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionLabel>Today's Mission</SectionLabel>
          <h2 className="mt-6 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            EVERY DAY, A <span className="text-gold">MISSION.</span>
          </h2>
          <div className="mt-6"><GoldDivider /></div>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground md:text-lg">
            Most fitness apps give you a workout. Deluxe gives you a mission — a curated
            stack of physical, mental and social tasks that move the needle every single day.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Tick them off. Build the streak. Earn the score.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <GoldButton>Get today's mission <ArrowRight className="h-4 w-4" /></GoldButton>
          </Link>
        </div>

        <div className="border border-gold/30 bg-gradient-to-br from-deluxe-card to-deluxe-black p-6 shadow-[0_30px_60px_-30px_rgba(212,175,55,0.35)] sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Today's Mission</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">3 of 5 complete</span>
          </div>
          <ul className="mt-6 space-y-3">
            {tasks.map(({ Icon, label, progress, done }) => (
              <li key={label} className="border border-gold/15 bg-deluxe-black/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${done ? "text-gold" : "text-gold/70"}`} strokeWidth={1.5} />
                    <span className={`text-sm ${done ? "text-foreground line-through opacity-70" : "text-foreground"}`}>{label}</span>
                  </div>
                  {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />}
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden bg-gold/10">
                  <div className="h-full bg-gold-gradient transition-all" style={{ width: `${progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Deluxe Score ---------------- */
function DeluxeScore() {
  const segments = [
    { Icon: Dumbbell, label: "Training", pts: 20, color: "from-gold to-gold/60" },
    { Icon: Droplet, label: "Water", pts: 10, color: "from-gold/90 to-gold/50" },
    { Icon: Salad, label: "Nutrition", pts: 15, color: "from-gold/95 to-gold/55" },
    { Icon: Moon, label: "Sleep", pts: 15, color: "from-gold/90 to-gold/50" },
    { Icon: Target, label: "Daily Goals", pts: 40, color: "from-gold to-gold/70" },
  ];
  const total = 87;
  return (
    <section className="relative overflow-hidden border-y border-gold/15 bg-deluxe-dark py-28">
      <div className="gold-glow absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <SectionLabel>The Deluxe Score</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            ONE NUMBER. <span className="text-gold">YOUR ENTIRE DAY.</span>
          </h2>
          <div className="mt-6 flex justify-center"><GoldDivider /></div>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Your signature metric. Out of 100. Every category adds up — and the leaderboard sees it.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
          {/* Score ring */}
          <div className="mx-auto">
            <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" stroke="rgba(212,175,55,0.12)" strokeWidth="6" fill="none" />
                <circle
                  cx="50" cy="50" r="44"
                  stroke="url(#gradScore)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={(2 * Math.PI * 44) * (1 - total / 100)}
                  fill="none"
                />
                <defs>
                  <linearGradient id="gradScore" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#f5d76e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center">
                <div className="font-display text-6xl text-foreground tabular-nums sm:text-7xl">{total}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Deluxe Score</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">out of 100</div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {segments.map(({ Icon, label, pts, color }) => (
              <div key={label} className="border border-gold/20 bg-deluxe-black/60 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">{label}</span>
                  </div>
                  <div className="font-display text-lg text-gold tabular-nums">{pts}<span className="text-xs text-muted-foreground">pts</span></div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden bg-gold/10">
                  <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${pts}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


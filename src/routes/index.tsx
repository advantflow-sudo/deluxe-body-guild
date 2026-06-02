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
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
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

/* ---------------- Transformation Gallery ---------------- */
function TransformationGallery() {
  const stories = [
    {
      img: workout1,
      name: "Marcus T.",
      start: "118 kg",
      now: "99 kg",
      time: "6 months",
      streak: "82 days",
      quote: "Lost the weight. Kept the discipline.",
    },
    {
      img: workout2,
      name: "Sofia L.",
      start: "54 kg",
      now: "62 kg lean",
      time: "9 months",
      streak: "147 days",
      quote: "Built the body I thought wasn't possible.",
    },
    {
      img: workout3,
      name: "Daniel K.",
      start: "104 kg",
      now: "82 kg",
      time: "12 months",
      streak: "210 days",
      quote: "Down 22kg. Up two suit sizes in the shoulders.",
    },
    {
      img: communityImg,
      name: "Priya A.",
      start: "Never ran 1km",
      now: "First marathon",
      time: "8 months",
      streak: "96 days",
      quote: "Deluxe gave me the discipline I always lacked.",
    },
  ];
  return (
    <section className="bg-deluxe-dark py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <SectionLabel>Transformation Gallery</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            REAL MEMBERS. <span className="text-gold">REAL NUMBERS.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <GoldDivider />
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {stories.map((s) => (
            <figure key={s.name} className="group grid grid-cols-[1fr_1.2fr] overflow-hidden border border-gold/20 bg-deluxe-card">
              <div className="aspect-[3/4] overflow-hidden bg-deluxe-black">
                <img
                  src={s.img}
                  alt={`${s.name} transformation`}
                  loading="lazy"
                  className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
              <div className="flex flex-col justify-between p-6">
                <div>
                  <Zap className="h-4 w-4 text-gold" />
                  <figcaption className="mt-2 font-display text-2xl tracking-wide text-foreground">
                    {s.name.toUpperCase()}
                  </figcaption>
                  <p className="mt-2 font-serif text-sm italic text-muted-foreground">"{s.quote}"</p>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gold/15 pt-4 text-[11px]">
                  <Stat label="Starting" value={s.start} />
                  <Stat label="Current" value={s.now} />
                  <Stat label="Time" value={s.time} />
                  <Stat label="Streak" value={s.streak} />
                </dl>
              </div>
            </figure>
          ))}
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

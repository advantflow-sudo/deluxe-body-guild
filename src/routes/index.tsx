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
      <Mission />
      <FeatureIcons />
      <WhyDeluxe />
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
          <h1 className="mt-6 font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
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

        <div className="mx-auto mt-14 inline-block border border-gold/40 px-10 py-6">
          <p className="font-display text-2xl tracking-[0.25em] text-gold sm:text-3xl">
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
        <p className="font-display text-2xl tracking-[0.2em] text-foreground/25 sm:text-3xl md:text-4xl">
          DISCIPLINE TODAY. DELUXE FOREVER.
        </p>
        <p className="mt-6 font-display text-3xl tracking-[0.2em] text-foreground/55 sm:text-4xl md:text-5xl">
          BUILT IN THE GYM. ELEVATED IN LIFE.
        </p>
        <p className="mt-6 font-display text-4xl tracking-[0.2em] text-gold sm:text-5xl md:text-7xl">
          MORE THAN FITNESS.
          <br /> IT'S A LIFESTYLE.
        </p>
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

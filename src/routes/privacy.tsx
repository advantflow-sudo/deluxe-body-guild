import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { LegalDocument, LegalSection } from "@/components/deluxe/LegalDocument";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Deluxe Fitness" },
      { name: "description", content: "How Deluxe Fitness collects, uses and protects your personal data. GDPR & UK GDPR compliant." },
      { property: "og:title", content: "Privacy Policy — Deluxe Fitness" },
      { property: "og:description", content: "Your data, your rights, our responsibilities." },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Privacy"
        highlight="Policy."
        body="Your data is yours. Here's exactly what we collect, why we collect it, and how to control it."
      />
      <LegalDocument updated="9 June 2026">
        <LegalSection title="1. Who we are">
          Deluxe Fitness Ltd ("we", "us", "our") is the data controller for personal data processed
          through the Deluxe Fitness app and website. Contact:{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:privacy@deluxefitness.app">
            privacy@deluxefitness.app
          </a>
          .
        </LegalSection>
        <LegalSection title="2. Data we collect">
          <ul className="list-disc space-y-2 pl-5 marker:text-gold">
            <li><strong className="text-foreground">Account data</strong> — name, email, display name, profile photo.</li>
            <li><strong className="text-foreground">Fitness & wellbeing data</strong> — workouts, habits, body measurements, progress photos you upload.</li>
            <li><strong className="text-foreground">Device data</strong> — when you connect Apple Health, Google Fit, Garmin, Whoop or Oura, we receive the metrics you authorise.</li>
            <li><strong className="text-foreground">Usage data</strong> — pages viewed, features used, error logs (for performance and reliability).</li>
            <li><strong className="text-foreground">Communications</strong> — messages with our AI Coach, support emails and community posts.</li>
          </ul>
        </LegalSection>
        <LegalSection title="3. How we use your data">
          We process your data to operate the App, personalise your training and nutrition, match you
          with accountability partners, send service emails, prevent fraud and abuse, and improve our
          features. Where we rely on consent (e.g. marketing), you can withdraw consent at any time.
        </LegalSection>
        <LegalSection title="4. Legal bases (GDPR / UK GDPR)">
          We rely on: contract (to provide the service you signed up for), legitimate interests
          (to improve and secure the App), consent (for marketing and optional cookies) and legal
          obligation (where the law requires it).
        </LegalSection>
        <LegalSection title="5. Sharing your data">
          We share data only with vetted processors who help us run the App — including our cloud and
          authentication provider (Supabase / AWS / Cloudflare), our AI inference provider, and
          analytics tools. We never sell your personal data.
        </LegalSection>
        <LegalSection title="6. International transfers">
          Some processors are located outside the UK / EU. When data is transferred, we use Standard
          Contractual Clauses and equivalent safeguards.
        </LegalSection>
        <LegalSection title="7. Retention">
          We keep your data while your account is active. When you delete your account, we erase your
          personal data within 30 days, except where law requires us to keep it (e.g. tax records).
        </LegalSection>
        <LegalSection title="8. Your rights">
          Under GDPR / UK GDPR you can: access, rectify, erase, restrict, port or object to the
          processing of your personal data, and lodge a complaint with the ICO (or your local data
          protection authority). Email{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:privacy@deluxefitness.app">
            privacy@deluxefitness.app
          </a>{" "}
          to exercise any of these rights.
        </LegalSection>
        <LegalSection title="9. Cookies">
          We use essential cookies to keep you signed in and the App working. We use analytics and
          marketing cookies only with your consent — manage these any time via the cookie banner.
        </LegalSection>
        <LegalSection title="10. Children">
          The App is not intended for users under 16. We do not knowingly collect data from children.
        </LegalSection>
        <LegalSection title="11. Security">
          We use encryption in transit (TLS) and at rest, role-based access controls, and regular
          security reviews. No system is 100% secure, but we treat protecting your data as a priority.
        </LegalSection>
        <LegalSection title="12. Changes">
          We'll notify you of material changes to this policy via the App or email.
        </LegalSection>
      </LegalDocument>
    </PageShell>
  );
}

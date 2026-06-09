import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { LegalDocument, LegalSection } from "@/components/deluxe/LegalDocument";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Deluxe Fitness" },
      { name: "description", content: "The terms and conditions governing your use of Deluxe Fitness." },
      { property: "og:title", content: "Terms & Conditions — Deluxe Fitness" },
      { property: "og:description", content: "Terms of service for Deluxe Fitness members." },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Terms &"
        highlight="Conditions."
        body="The rules of the road for using Deluxe Fitness. Last updated June 2026."
      />
      <LegalDocument updated="9 June 2026">
        <LegalSection title="1. Acceptance of terms">
          By creating an account or using Deluxe Fitness ("the App", "we", "us"), you agree to these
          Terms. If you do not agree, please do not use the App.
        </LegalSection>
        <LegalSection title="2. Eligibility">
          You must be at least 16 years old to create an account. By signing up, you confirm that you
          can lawfully enter into a binding agreement and that all information you provide is accurate.
        </LegalSection>
        <LegalSection title="3. Health & fitness disclaimer">
          Deluxe Fitness provides general fitness, nutrition and wellbeing information. It is not
          medical advice. Always consult a qualified professional before starting any exercise or
          nutrition programme, especially if you have an existing medical condition. You assume full
          responsibility for any actions taken based on the content in the App.
        </LegalSection>
        <LegalSection title="4. Subscriptions & payments">
          Some features require a paid subscription. Pricing, billing frequency and renewal terms are
          shown at checkout. Subscriptions automatically renew unless cancelled before the renewal
          date. Refunds are handled in accordance with your local consumer rights law.
        </LegalSection>
        <LegalSection title="5. Acceptable use">
          You agree not to misuse the App — including, but not limited to, posting illegal,
          discriminatory or harmful content, harassing other members, attempting to access another
          user's account, reverse engineering the platform, or using the App for commercial purposes
          without our written permission.
        </LegalSection>
        <LegalSection title="6. User content">
          You retain ownership of content you post (workouts, photos, comments). You grant Deluxe
          Fitness a non-exclusive, worldwide, royalty-free licence to host, display and distribute
          that content within the App. You are solely responsible for the content you share.
        </LegalSection>
        <LegalSection title="7. Intellectual property">
          All Deluxe Fitness branding, design, code, programming, AI-generated guidance and content is
          owned by Deluxe Fitness Ltd or its licensors and is protected by intellectual property law.
        </LegalSection>
        <LegalSection title="8. Termination">
          We may suspend or terminate your account at any time if you breach these Terms. You may
          cancel your account at any time from your profile page.
        </LegalSection>
        <LegalSection title="9. Limitation of liability">
          To the maximum extent permitted by law, Deluxe Fitness is not liable for indirect,
          incidental, special or consequential damages arising from your use of the App.
        </LegalSection>
        <LegalSection title="10. Changes to these terms">
          We may update these Terms from time to time. We'll notify you of material changes via the
          App or email. Continued use after changes means you accept the updated Terms.
        </LegalSection>
        <LegalSection title="11. Governing law">
          These Terms are governed by the laws of England and Wales. Any disputes will be subject to
          the exclusive jurisdiction of the courts of England and Wales.
        </LegalSection>
        <LegalSection title="12. Contact">
          Questions about these Terms? Email{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:legal@deluxefitness.app">
            legal@deluxefitness.app
          </a>
          .
        </LegalSection>
      </LegalDocument>
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/deluxe/PageShell";
import { LegalDocument, LegalSection } from "@/components/deluxe/LegalDocument";

export const Route = createFileRoute("/company-policy")({
  head: () => ({
    meta: [
      { title: "Company Policy — Deluxe Fitness" },
      { name: "description", content: "Our community guidelines, code of conduct, refund policy and accessibility commitments." },
      { property: "og:title", content: "Company Policy — Deluxe Fitness" },
      { property: "og:description", content: "How we run Deluxe Fitness as a company and a community." },
    ],
    links: [{ rel: "canonical", href: "https://deluxefitness.app/company-policy" }],
  }),
  component: CompanyPolicyPage,
});

function CompanyPolicyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title="Company"
        highlight="Policy."
        body="The values, standards and operational policies behind Deluxe Fitness."
      />
      <LegalDocument updated="9 June 2026">
        <LegalSection title="1. Our mission">
          Deluxe Fitness exists to help people transform their lives through fitness, mindset and
          community. Every product decision, partnership and policy is filtered through that mission.
        </LegalSection>
        <LegalSection title="2. Community guidelines">
          <ul className="list-disc space-y-2 pl-5 marker:text-gold">
            <li>Be respectful. Discrimination, harassment, hate speech or bullying is grounds for permanent removal.</li>
            <li>Stay honest. No fake transformations, paid endorsements without disclosure, or misleading health claims.</li>
            <li>Lift others. Celebrate progress at every level. This is not a place for ego.</li>
            <li>Protect privacy. Don't share another member's data, photos or personal details without consent.</li>
          </ul>
        </LegalSection>
        <LegalSection title="3. Refund policy">
          We offer a 14-day money-back guarantee on first-time premium subscriptions. After 14 days,
          subscriptions are non-refundable for the current billing period but can be cancelled at any
          time to prevent renewal. Email{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:billing@deluxefitness.app">
            billing@deluxefitness.app
          </a>{" "}
          to request a refund.
        </LegalSection>
        <LegalSection title="4. Accessibility">
          We design Deluxe Fitness to meet WCAG 2.2 AA. Found an accessibility barrier? Email{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:hello@deluxefitness.app">
            hello@deluxefitness.app
          </a>{" "}
          and we'll fix it.
        </LegalSection>
        <LegalSection title="5. Safeguarding & wellbeing">
          If you or someone you know is struggling with disordered eating, exercise addiction or
          mental health, please reach out to a qualified professional. Our AI Coach is not a
          substitute for clinical care.
        </LegalSection>
        <LegalSection title="6. Anti-modern-slavery & ethical sourcing">
          We expect every supplier, partner and contractor to uphold human-rights and ethical labour
          standards. We do not tolerate forced labour, child labour or human trafficking in any part
          of our supply chain.
        </LegalSection>
        <LegalSection title="7. Environmental policy">
          We track and reduce the energy footprint of our infrastructure, prefer renewable-powered
          cloud regions, and design merchandise (when available) for durability over disposability.
        </LegalSection>
        <LegalSection title="8. Reporting concerns">
          To report a safeguarding, abuse, security or ethical concern, contact{" "}
          <a className="text-gold underline-offset-4 hover:underline" href="mailto:trust@deluxefitness.app">
            trust@deluxefitness.app
          </a>
          . Reports are handled confidentially.
        </LegalSection>
        <LegalSection title="9. Updates">
          This policy is reviewed annually and updated whenever there's a material change. We'll
          announce updates in-app and via email where relevant.
        </LegalSection>
      </LegalDocument>
    </PageShell>
  );
}

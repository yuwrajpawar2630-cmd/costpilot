import { ESTIMATE_DISCLAIMER } from "@/types";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-zinc">
      <h1>Terms of Service</h1>
      <p>Last updated: June 2026</p>
      <h2>Service description</h2>
      <p>
        CostPilot AI provides AI-assisted draft construction cost estimates
        from uploaded blueprint PDFs. This is not project management software.
      </p>
      <h2>Estimate disclaimer</h2>
      <p>{ESTIMATE_DISCLAIMER}</p>
      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, CostPilot AI shall not be liable
        for any damages arising from reliance on AI-generated estimates,
        including lost bids, cost overruns, or construction defects.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Paid plans renew monthly via Stripe. Cancel anytime from account
        settings.
      </p>
    </div>
  );
}

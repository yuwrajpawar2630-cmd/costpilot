import { PricingCards } from "@/components/marketing/pricing-cards";
import { getMetadata } from "@/lib/seo";

export const metadata = getMetadata({
  title: "Pricing Plans — CostPilot AI",
  description:
    "Simple and transparent pricing for contractors and builders. Try for free with 2 estimates per month, or upgrade to bid faster and win more projects.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Simple pricing for small crews</h1>
        <p className="mt-3 text-zinc-600">
          Start free. Upgrade when you&apos;re bidding every week.
        </p>
      </div>
      <div className="mt-12">
        <PricingCards />
      </div>
      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <dl className="mt-4 space-y-4 text-sm text-zinc-600">
          <div>
            <dt className="font-medium text-zinc-900">Is this a bid guarantee?</dt>
            <dd className="mt-1">
              No. Every output is a draft estimate for planning. Always verify
              before submitting bids.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">What file types?</dt>
            <dd className="mt-1">PDF, PNG, and JPG/JPEG files, up to 25MB.</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Which markets?</dt>
            <dd className="mt-1">
              MVP supports USA pricing with regional multipliers by state.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

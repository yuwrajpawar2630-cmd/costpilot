import { BetaSignupForm } from "@/components/marketing/beta-signup-form";

export default function BetaPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Join the beta program</h1>
      <p className="mt-4 text-zinc-600">
        We&apos;re recruiting 20 residential general contractors to test CostPilot
        AI before public launch. Get early access and help shape the product.
      </p>
      <div className="mt-10 text-left">
        <BetaSignupForm />
      </div>
      <p className="mt-8 text-xs text-zinc-500">
        Beta spots are limited. No spam — one email when your access is ready.
      </p>
    </div>
  );
}

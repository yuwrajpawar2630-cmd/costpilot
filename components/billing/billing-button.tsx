"use client";

export function BillingButton({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  if (hasSubscription) {
    return (
      <a
        href="/pricing"
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm transition-colors cursor-pointer"
      >
        View Pricing
      </a>
    );
  }

  return (
    <a
      href="/pricing"
      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm transition-colors"
    >
      Upgrade Plan
    </a>
  );
}

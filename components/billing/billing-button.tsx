"use client";

import { useState } from "react";

export function BillingButton({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to open billing portal. Please make sure you have an active subscription.");
        setLoading(false);
      }
    } catch (err) {
      alert("Something went wrong");
      setLoading(false);
    }
  }

  if (hasSubscription) {
    return (
      <button
        onClick={handleManage}
        disabled={loading}
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Opening Portal..." : "Manage Subscription"}
      </button>
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

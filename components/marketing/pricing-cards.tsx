"use client";

import { useState } from "react";
import { PLAN_LIMITS } from "@/types";

export function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: "starter" | "pro" | "enterprise") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to initiate Stripe Checkout. Make sure Stripe keys are set in your .env.local file.");
        setLoading(null);
      }
    } catch (err) {
      alert("Something went wrong");
      setLoading(null);
    }
  }

  const plans = [
    {
      id: "free" as const,
      ...PLAN_LIMITS.free,
      features: [
        "2 AI Estimates per month",
        "Full AI Cost Breakdown",
        "8 Cost Categories",
        "Save Estimate History"
      ],
      buttonText: "Get Started",
      badge: null,
    },
    {
      id: "starter" as const,
      ...PLAN_LIMITS.starter,
      features: [
        "15 AI Estimates per month",
        "Priority AI Processing",
        "Email Support",
        "Unlimited Estimate History"
      ],
      buttonText: "Upgrade to Starter",
      badge: null,
    },
    {
      id: "pro" as const,
      ...PLAN_LIMITS.pro,
      features: [
        "100 AI Estimates per month",
        "Priority AI Processing",
        "Custom AI Adjustments",
        "Faster AI Responses",
        "Premium Support"
      ],
      buttonText: "Upgrade to Pro",
      badge: "Most Popular",
    },
    {
      id: "enterprise" as const,
      ...PLAN_LIMITS.enterprise,
      features: [
        "Unlimited AI Estimates",
        "Unlimited Blueprint Analysis",
        "Fastest AI Processing",
        "Highest Priority Queue",
        "Premium AI Recommendations",
        "Future Enterprise Features",
        "Priority Support"
      ],
      buttonText: "Upgrade to Enterprise",
      badge: "Premium",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {plans.map((plan) => {
        const isPro = plan.id === "pro";
        const isEnterprise = plan.id === "enterprise";

        return (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
              isPro 
                ? "border-orange-500 ring-2 ring-orange-100 bg-white scale-105 md:scale-105" 
                : isEnterprise
                ? "border-zinc-800 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white"
            }`}
          >
            {plan.badge && (
              <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${
                isPro 
                  ? "bg-orange-600 text-white" 
                  : "bg-zinc-100 text-zinc-900"
              }`}>
                {plan.badge}
              </span>
            )}

            <div>
              <h3 className={`text-lg font-bold ${isEnterprise ? "text-white" : "text-zinc-900"}`}>{plan.label}</h3>
              <p className="mt-3">
                <span className={`text-4xl font-black ${isEnterprise ? "text-white" : "text-zinc-900"}`}>
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className={`text-sm font-semibold ${isEnterprise ? "text-zinc-400" : "text-zinc-500"}`}>/mo</span>
                )}
              </p>
              <p className={`mt-1.5 text-xs font-medium ${isEnterprise ? "text-zinc-400" : "text-zinc-500"}`}>
                {plan.id === "enterprise" ? "Unlimited" : `${plan.limit} estimates / month`}
              </p>

              <ul className="mt-6 space-y-3.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className={`font-bold ${isEnterprise ? "text-orange-400" : "text-orange-600"}`}>✓</span>
                    <span className={isEnterprise ? "text-zinc-300" : "text-zinc-600"}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              {plan.id === "free" ? (
                <a
                  href="/signup"
                  className={`block w-full rounded-xl py-3 text-center text-sm font-bold shadow-sm transition-colors ${
                    isEnterprise
                      ? "bg-zinc-800 text-white hover:bg-zinc-750 border border-zinc-700"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border border-zinc-200"
                  }`}
                >
                  {plan.buttonText}
                </a>
              ) : (
                <button
                  onClick={() => checkout(plan.id)}
                  disabled={loading !== null}
                  className="w-full rounded-xl py-3 text-center text-sm font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer bg-orange-600 text-white hover:bg-orange-700"
                >
                  {loading === plan.id ? "Redirecting..." : plan.buttonText}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

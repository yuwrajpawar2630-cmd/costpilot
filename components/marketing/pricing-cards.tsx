"use client";

import { useState } from "react";
import { PLAN_LIMITS } from "@/types";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "razorpay" | null>(null);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Razorpay checkout flow
  async function checkoutRazorpay(plan: "starter" | "pro" | "enterprise") {
    setLoading(plan);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error ?? "Failed to initiate payment. Make sure Razorpay keys are set in your .env.local file.");
        setLoading(null);
        setSelectedPlan(null);
        setPaymentMethod(null);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        setLoading(null);
        setSelectedPlan(null);
        setPaymentMethod(null);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "CostPilot AI",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              window.location.href = "/dashboard?success=1";
            } else {
              alert(verifyData.error ?? "Payment verification failed.");
              setLoading(null);
              setSelectedPlan(null);
              setPaymentMethod(null);
            }
          } catch (err) {
            alert("Verification failed. Please contact support.");
            setLoading(null);
            setSelectedPlan(null);
            setPaymentMethod(null);
          }
        },
        prefill: {
          email: data.prefillEmail || "",
        },
        theme: {
          color: "#ea580c",
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
            setSelectedPlan(null);
            setPaymentMethod(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Something went wrong");
      setLoading(null);
      setSelectedPlan(null);
      setPaymentMethod(null);
    }
  }

  // PayPal checkout flow
  async function startPayPalFlow(plan: "starter" | "pro" | "enterprise") {
    setPaypalLoading(true);
    try {
      const res = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error ?? "Failed to create PayPal order.");
        setPaypalLoading(false);
        setPaymentMethod(null);
        return;
      }

      // Load PayPal JS SDK dynamically
      const loaded = await new Promise<boolean>((resolve) => {
        if ((window as any).paypal) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=USD&intent=capture`;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!loaded) {
        alert("Failed to load PayPal SDK. Please check your internet connection.");
        setPaypalLoading(false);
        setPaymentMethod(null);
        return;
      }

      setPaypalLoading(false);

      // Render PayPal buttons into the modal container
      if ((window as any).paypal && document.getElementById("paypal-button-container")) {
        (window as any).paypal.Buttons({
          createOrder: function() {
            return data.orderId;
          },
          onApprove: async function(approveData: any) {
            setLoading(plan);
            try {
              const verifyRes = await fetch("/api/paypal/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: approveData.orderID,
                  plan,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                window.location.href = "/dashboard?success=1";
              } else {
                alert(verifyData.error ?? "PayPal payment verification failed.");
                setLoading(null);
                setSelectedPlan(null);
                setPaymentMethod(null);
              }
            } catch (err) {
              alert("Verification failed. Please contact support.");
              setLoading(null);
              setSelectedPlan(null);
              setPaymentMethod(null);
            }
          },
          onError: function(err: any) {
            console.error("PayPal Error:", err);
            alert("PayPal checkout encountered an error.");
            setLoading(null);
            setSelectedPlan(null);
            setPaymentMethod(null);
          },
          onCancel: function() {
            setLoading(null);
            setSelectedPlan(null);
            setPaymentMethod(null);
          }
        }).render("#paypal-button-container");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong with PayPal checkout.");
      setPaypalLoading(false);
      setPaymentMethod(null);
    }
  }

  function handleSelectPayment(method: "paypal" | "razorpay") {
    setPaymentMethod(method);
    if (method === "razorpay" && selectedPlan) {
      checkoutRazorpay(selectedPlan);
    } else if (method === "paypal" && selectedPlan) {
      setTimeout(() => {
        startPayPalFlow(selectedPlan);
      }, 50);
    }
  }

  function handleCloseModal() {
    setSelectedPlan(null);
    setPaymentMethod(null);
    setPaypalLoading(false);
    setLoading(null);
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
        "Full Estimate History"
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
        "999,999 AI Estimates",
        "999,999 Blueprint Analyses",
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
                {plan.id === "enterprise" ? "999,999 estimates / month" : `${plan.limit} estimates / month`}
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
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={loading !== null}
                  className="w-full rounded-xl py-3 text-center text-sm font-bold shadow-sm transition-colors disabled:opacity-60 cursor-pointer bg-orange-600 text-white hover:bg-orange-700"
                >
                  {selectedPlan === plan.id ? "Upgrading..." : plan.buttonText}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Payment Selection Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 flex flex-col gap-5 text-zinc-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-lg font-bold text-zinc-900">
                Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-650 text-xl font-bold cursor-pointer transition-colors px-2"
              >
                ✕
              </button>
            </div>

            {paymentMethod === null ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-500">
                  Select your preferred payment gateway to complete your subscription purchase:
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleSelectPayment("paypal")}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-yellow-300 bg-yellow-400 py-3.5 text-sm font-bold text-yellow-950 shadow-sm hover:bg-yellow-400/90 transition-colors cursor-pointer"
                  >
                    <span className="text-base font-extrabold italic tracking-tight text-blue-900">
                      Pay with <span className="text-blue-800">Pay</span><span className="text-yellow-600">Pal</span>
                    </span>
                  </button>

                  <button
                    onClick={() => handleSelectPayment("razorpay")}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-blue-400 bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <span>Pay with Razorpay</span>
                  </button>
                </div>
              </div>
            ) : paymentMethod === "paypal" ? (
              <div className="flex flex-col gap-4">
                {paypalLoading ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-8 h-8 border-4 border-zinc-200 border-t-yellow-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-zinc-600">Initializing PayPal Checkout...</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500 text-center mb-2">
                      Complete payment via the PayPal button below:
                    </p>
                    <div id="paypal-button-container" className="w-full min-h-[150px]"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-zinc-600">Opening Razorpay Checkout...</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={handleCloseModal}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

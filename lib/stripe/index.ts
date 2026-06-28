import Stripe from "stripe";
import { PLAN_LIMITS, type PlanType } from "@/types";
import { STRIPE_PRICES } from "@/lib/constants";
import { DEMO_USER_ID } from "@/lib/db/local-store";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const PRICE_TO_PLAN: Record<string, PlanType> = {
  [STRIPE_PRICES.starter]: "starter",
  [STRIPE_PRICES.pro]: "pro",
  [STRIPE_PRICES.enterprise]: "enterprise",
};

export async function createCheckoutSession(input: {
  plan: "starter" | "pro" | "enterprise";
  userId: string;
  email: string;
  origin: string;
}) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const priceId = STRIPE_PRICES[input.plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${input.origin}/dashboard?success=1`,
    cancel_url: `${input.origin}/pricing?canceled=1`,
    metadata: { userId: input.userId, plan: input.plan },
    subscription_data: {
      metadata: { userId: input.userId, plan: input.plan },
    },
  });

  return session;
}

export async function createPortalSession(input: {
  customerId: string;
  origin: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  return stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${input.origin}/dashboard`,
  });
}

export async function syncSubscription(subscriptionId: string) {
  const stripe = getStripe();
  if (!stripe) return;

  const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
  const priceId = sub.items.data[0]?.price.id;

  let plan: PlanType = "free";
  if (priceId === STRIPE_PRICES.starter) plan = "starter";
  else if (priceId === STRIPE_PRICES.pro) plan = "pro";
  else if (priceId === STRIPE_PRICES.enterprise) plan = "enterprise";

  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("No userId found in subscription metadata:", subscriptionId);
    return;
  }

  const limit = PLAN_LIMITS[plan].limit;

  const updates = {
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    current_plan: plan,
    subscription_status: sub.status,
    monthly_estimate_limit: limit,
    billing_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    billing_period_end: new Date(sub.current_period_end * 1000).toISOString(),
  };

  // 1. Update local database
  const { updateLocalSubscriptionDetail } = await import("@/lib/db/local-store");
  updateLocalSubscriptionDetail(userId, updates);

  // 2. Update Supabase
  const { isSupabaseConfigured } = await import("@/lib/supabase/client");
  if (isSupabaseConfigured()) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    if (supabase) {
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: updates.stripe_customer_id,
        stripe_subscription_id: updates.stripe_subscription_id,
        current_plan: updates.current_plan,
        subscription_status: updates.subscription_status,
        monthly_estimate_limit: updates.monthly_estimate_limit,
        billing_period_start: updates.billing_period_start,
        billing_period_end: updates.billing_period_end,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Supabase upsert error in syncSubscription:", error.message);
      }
    }
  }
}

export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ received: boolean }> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    throw new Error("Stripe webhook not configured");
  }

  const event = stripe.webhooks.constructEvent(payload, signature, secret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        await syncSubscription(session.subscription as string);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub.id);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        await syncSubscription(invoice.subscription as string);
      }
      break;
    }
    default:
      break;
  }

  return { received: true };
}

export { PLAN_LIMITS };

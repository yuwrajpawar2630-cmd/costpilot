import { NextRequest, NextResponse } from "next/server";
import { requireUserId, getUserProfile, isDemoMode } from "@/lib/auth/session";
import {
  createCheckoutSession,
  createPortalSession,
  isStripeConfigured,
} from "@/lib/stripe";
import { DEMO_USER_ID } from "@/lib/db/local-store";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe not configured. See .env.example" },
        { status: 503 }
      );
    }

    const userId = await requireUserId();
    const body = await request.json();
    const { plan, action } = body as {
      plan?: "starter" | "pro" | "enterprise";
      action?: "portal";
    };

    const profile = (await getUserProfile(userId)) ?? (await getUserProfile(DEMO_USER_ID));
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    let customerId = profile?.stripe_customer_id || null;

    if (!isDemoMode()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      if (supabase) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (sub?.stripe_customer_id) {
          customerId = sub.stripe_customer_id;
        }
      }
    } else {
      const { getLocalSubscription } = await import("@/lib/db/local-store");
      const sub = getLocalSubscription(userId);
      if (sub?.stripe_customer_id) {
        customerId = sub.stripe_customer_id;
      }
    }

    if (action === "portal") {
      if (!customerId) {
        return NextResponse.json(
          { error: "You do not have an active billing customer ID. Please subscribe to a plan first." },
          { status: 400 }
        );
      }
      const session = await createPortalSession({
        customerId,
        origin,
      });
      return NextResponse.json({ url: session.url });
    }

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await createCheckoutSession({
      plan,
      userId,
      email: profile?.email ?? "demo@costpilot.ai",
      origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

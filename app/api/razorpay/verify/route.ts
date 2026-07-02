import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { PLAN_LIMITS } from "@/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      plan?: "starter" | "pro" | "enterprise";
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json(
        { error: "Missing required verification parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay key secret is not configured on the server" },
        { status: 500 }
      );
    }

    // Verify Razorpay payment signature using HMAC-SHA256
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Razorpay signature verification failed. Invalid payment." },
        { status: 400 }
      );
    }

    const limit = PLAN_LIMITS[plan].limit;
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const updates = {
      stripe_customer_id: razorpay_payment_id,
      stripe_subscription_id: razorpay_order_id,
      current_plan: plan,
      subscription_status: "active",
      monthly_estimate_limit: limit,
      billing_period_start: now.toISOString(),
      billing_period_end: periodEnd.toISOString(),
    };

    // 1. Update local database subscription
    const { updateLocalSubscriptionDetail } = await import("@/lib/db/local-store");
    updateLocalSubscriptionDetail(userId, updates);

    // 2. Update local database profile
    try {
      const fs = require("fs");
      const path = require("path");
      const dbPath = path.join(process.cwd(), ".data", "costpilot.json");
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        const profile = db.profiles?.find((p: any) => p.id === userId);
        if (profile) {
          profile.stripe_customer_id = razorpay_payment_id;
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
      }
    } catch (e) {
      console.error("Failed to update profile in local store:", e);
    }

    // 3. Update Supabase (if configured)
    const { isSupabaseConfigured } = await import("@/lib/supabase/client");
    if (isSupabaseConfigured()) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = await createServiceClient();
      if (supabase) {
        // Upsert subscription
        const { error: subError } = await supabase.from("subscriptions").upsert({
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
        if (subError) {
          console.error("Supabase subscription upsert error in verification:", subError.message);
        }

        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: razorpay_payment_id })
          .eq("id", userId);
        if (profileError) {
          console.error("Supabase profile update error in verification:", profileError.message);
        }
      }
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    console.error("Razorpay payment verification error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

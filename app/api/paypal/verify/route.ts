import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { PLAN_LIMITS } from "@/types";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured on the server");
  }

  const mode = process.env.PAYPAL_MODE || "sandbox";
  const authUrl =
    mode === "live"
      ? "https://api-m.paypal.com/v1/oauth2/token"
      : "https://api-m.sandbox.paypal.com/v1/oauth2/token";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch PayPal access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { orderId, plan } = body as { orderId?: string; plan?: "starter" | "pro" | "enterprise" };

    if (!orderId || !plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Missing required order ID or plan parameters" },
        { status: 400 }
      );
    }

    const mode = process.env.PAYPAL_MODE || "sandbox";
    const captureUrl =
      mode === "live"
        ? `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`
        : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(captureUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to capture PayPal payment: ${errorText}`);
    }

    const captureData = await response.json();
    const purchaseUnit = captureData.purchase_units?.[0];
    const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;

    if (captureData.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Payment is not completed. Current status: ${captureData.status}` },
        { status: 400 }
      );
    }

    // Verify customId to ensure it matches the user upgrading (or fall back to userId)
    let paymentUserId = userId;
    if (customId) {
      const parts = customId.split(":");
      if (parts.length >= 1) {
        paymentUserId = parts[0];
      }
    }

    // Get capture payment ID
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;

    const limit = PLAN_LIMITS[plan].limit;
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const updates = {
      stripe_customer_id: captureId, // Store PayPal capture ID as the customer payment identifier
      stripe_subscription_id: orderId, // Store PayPal order ID as the subscription identifier
      current_plan: plan,
      subscription_status: "active",
      monthly_estimate_limit: limit,
      billing_period_start: now.toISOString(),
      billing_period_end: periodEnd.toISOString(),
    };

    // 1. Update local database subscription
    const { updateLocalSubscriptionDetail } = await import("@/lib/db/local-store");
    updateLocalSubscriptionDetail(paymentUserId, updates);

    // 2. Update local database profile
    try {
      const fs = require("fs");
      const path = require("path");
      const dbPath = path.join(process.cwd(), ".data", "costpilot.json");
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        const profile = db.profiles?.find((p: any) => p.id === paymentUserId);
        if (profile) {
          profile.stripe_customer_id = captureId;
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
          user_id: paymentUserId,
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
          console.error("Supabase subscription upsert error in PayPal verification:", subError.message);
        }

        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: captureId })
          .eq("id", paymentUserId);
        if (profileError) {
          console.error("Supabase profile update error in PayPal verification:", profileError.message);
        }
      }
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal payment capture failed";
    console.error("PayPal capture verification error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

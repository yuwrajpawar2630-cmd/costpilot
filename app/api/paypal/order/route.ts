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
    const { plan } = body as { plan?: "starter" | "pro" | "enterprise" };

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const price = PLAN_LIMITS[plan].price;
    const mode = process.env.PAYPAL_MODE || "sandbox";
    const ordersUrl =
      mode === "live"
        ? "https://api-m.paypal.com/v2/checkout/orders"
        : "https://api-m.sandbox.paypal.com/v2/checkout/orders";

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(ordersUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: price.toFixed(2),
            },
            description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
            custom_id: `${userId}:${plan}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create PayPal order: ${errorText}`);
    }

    const order = await response.json();

    return NextResponse.json({
      orderId: order.id,
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate PayPal order";
    console.error("PayPal order creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

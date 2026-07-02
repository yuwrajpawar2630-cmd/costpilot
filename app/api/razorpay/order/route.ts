import { NextRequest, NextResponse } from "next/server";
import { requireUserId, getUserProfile } from "@/lib/auth/session";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { PLAN_LIMITS } from "@/types";
import { DEMO_USER_ID } from "@/lib/db/local-store";

export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables." },
        { status: 503 }
      );
    }

    const userId = await requireUserId();
    const body = await request.json();
    const { plan } = body as { plan?: "starter" | "pro" | "enterprise" };

    if (!plan || !["starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const profile = (await getUserProfile(userId)) ?? (await getUserProfile(DEMO_USER_ID));
    const amount = PLAN_LIMITS[plan].price * 100; // Price in cents/paise

    const razorpay = getRazorpay();
    if (!razorpay) {
      return NextResponse.json(
        { error: "Failed to initialize Razorpay client" },
        { status: 500 }
      );
    }

    // Razorpay receipt ID has a limit of 40 characters
    const receiptId = `rcpt_${userId.slice(0, 8)}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "USD",
      receipt: receiptId,
      notes: {
        userId,
        plan,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefillEmail: profile?.email ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate Razorpay order";
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

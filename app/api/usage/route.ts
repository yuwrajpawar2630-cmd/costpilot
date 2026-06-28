import { NextResponse } from "next/server";
import { requireUserId, getUserSubscription } from "@/lib/auth/session";

export async function GET() {
  try {
    const userId = await requireUserId();
    const subscription = await getUserSubscription(userId);

    return NextResponse.json({
      subscription,
      demo_mode: !process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}


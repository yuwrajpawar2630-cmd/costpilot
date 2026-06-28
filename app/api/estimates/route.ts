import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { listLocalEstimates } from "@/lib/db/local-store";

export async function GET() {
  try {
    const userId = await requireUserId();
    const estimates = listLocalEstimates(userId);
    return NextResponse.json({ estimates });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

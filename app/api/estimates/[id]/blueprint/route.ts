import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { getLocalEstimate } from "@/lib/db/local-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // 1. Verify ownership/access based on mode
    let hasAccess = false;
    const { isDemoMode } = await import("@/lib/auth/session");
    
    if (!isDemoMode()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("estimates")
          .select("id")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();
        if (data) hasAccess = true;
      }
    } else {
      const estimate = getLocalEstimate(id, userId);
      if (estimate) hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized or estimate not found" }, { status: 401 });
    }

    // 2. Fetch the blueprint file (checks local cache, falls back to Supabase Storage)
    const { getBlueprintFile } = await import("@/lib/db/local-store");
    const fileResult = await getBlueprintFile(id);
    if (!fileResult) {
      return NextResponse.json({ error: "Blueprint file not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileResult.buffer), {
      headers: {
        "Content-Type": fileResult.contentType,
        "Content-Disposition": `inline; filename="${fileResult.filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

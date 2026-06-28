import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import {
  createLocalEstimate,
  canCreateEstimate,
  getLocalEstimate,
  deleteLocalEstimate,
} from "@/lib/db/local-store";
import { MAX_PDF_SIZE_BYTES } from "@/lib/constants";
import { inngest, analyzeBlueprintEvent } from "@/lib/inngest/client";
import { runAnalysisPipeline } from "@/lib/jobs/analyze-blueprint";
import { isDemoMode } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    if (!isDemoMode()) {
      const { createClient } = await import("@/lib/supabase/server");
      const { mapSupabaseEstimateToRelation } = await import("@/lib/db/local-store");
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("estimates")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          const estimate = mapSupabaseEstimateToRelation(data);
          return NextResponse.json({ estimate });
        }
      }
    }

    const estimate = getLocalEstimate(id, userId);
    if (!estimate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ estimate });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    if (!isDemoMode()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase
          .from("estimates")
          .delete()
          .eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    const deleted = deleteLocalEstimate(id, userId);
    if (!deleted) {
      // In Supabase mode, it might have deleted it from Supabase, so let's check
      if (!isDemoMode()) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Use /api/estimates for create" }, { status: 405 });
}

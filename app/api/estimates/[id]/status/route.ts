import { NextRequest, NextResponse } from "next/server";
import { requireUserId, isDemoMode } from "@/lib/auth/session";
import { getLocalEstimate } from "@/lib/db/local-store";

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
          const mapped = mapSupabaseEstimateToRelation(data);
          return NextResponse.json({
            status: "completed",
            job: mapped.job,
            estimate: {
              total_cost: mapped.total_cost,
              category_totals: mapped.category_totals,
            },
            error: null,
          });
        }
      }
    }

    const estimate = getLocalEstimate(id, userId);
    if (!estimate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: estimate.status,
      job: estimate.job,
      estimate:
        estimate.status === "completed"
          ? {
              total_cost: estimate.total_cost,
              category_totals: estimate.category_totals,
            }
          : null,
      error: estimate.job?.error_message ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

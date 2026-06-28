import { NextRequest, NextResponse } from "next/server";
import { requireUserId, checkEstimateUsage, isDemoMode } from "@/lib/auth/session";
import {
  getLocalEstimate,
  getLocalJobByEstimateId,
} from "@/lib/db/local-store";
import { inngest, analyzeBlueprintEvent } from "@/lib/inngest/client";
import { runAnalysisPipeline } from "@/lib/jobs/analyze-blueprint";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const usage = await checkEstimateUsage(userId);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Estimate limit reached",
          used: usage.used,
          limit: usage.limit,
          plan: usage.plan,
        },
        { status: 402 }
      );
    }

    const estimate = getLocalEstimate(id, userId);
    if (!estimate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (isDemoMode() || !process.env.INNGEST_EVENT_KEY) {
      // Execute the analysis pipeline in the background so that the API responds
      // immediately, redirecting the user to the details page where they can see
      // a progress loading state and poll the job status.
      runAnalysisPipeline(id, userId).catch((error) => {
        console.error("Analysis pipeline background error:", error);
      });
    } else {
      await inngest.send({
        name: analyzeBlueprintEvent,
        data: { estimateId: id, userId },
      });
    }

    const job = getLocalJobByEstimateId(id);
    return NextResponse.json({
      job_id: job?.id,
      status: job?.status ?? "processing",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

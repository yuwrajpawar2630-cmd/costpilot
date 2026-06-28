import { inngest, analyzeBlueprintEvent } from "@/lib/inngest/client";
import { runAnalysisPipeline } from "@/lib/jobs/analyze-blueprint";

export const analyzeBlueprint = inngest.createFunction(
  {
    id: "analyze-blueprint",
    retries: 2,
    triggers: [{ event: analyzeBlueprintEvent }],
  },
  async ({ event }) => {
    const { estimateId, userId } = event.data as {
      estimateId: string;
      userId: string;
    };

    return runAnalysisPipeline(estimateId, userId);
  }
);

export const inngestFunctions = [analyzeBlueprint];

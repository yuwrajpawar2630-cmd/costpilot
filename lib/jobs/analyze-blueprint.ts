import { extractBlueprintData } from "@/lib/ai/extract-blueprint";
import {
  buildEstimateFromExtraction,
  attachLineItemIds,
} from "@/lib/ai/estimate";
import { renderPdfPagesToBase64, getPdfPageCount } from "@/lib/pdf/render-pages";
import {
  getLocalEstimate,
  updateLocalJob,
  updateLocalEstimate,
  getLocalJobByEstimateId,
  getBlueprintFile,
} from "@/lib/db/local-store";
import { incrementSubscriptionUsage } from "@/lib/auth/session";
import type { CostCategory } from "@/types";

export async function runAnalysisPipeline(estimateId: string, userId: string) {
  const estimate = getLocalEstimate(estimateId, userId);
  if (!estimate || !estimate.blueprint) {
    throw new Error("Estimate or blueprint not found");
  }

  const job = getLocalJobByEstimateId(estimateId);
  if (!job) throw new Error("Analysis job not found");

  updateLocalJob(job.id, {
    status: "processing",
    started_at: new Date().toISOString(),
  });

  updateLocalEstimate(estimateId, { status: "processing" });

  try {
    const blueprintFile = await getBlueprintFile(estimateId);
    if (!blueprintFile) throw new Error("Blueprint file not found");
    const blueprintBuffer = blueprintFile.buffer;

    const filename = estimate.blueprint.original_filename.toLowerCase();
    const isPdf = filename.endsWith(".pdf");

    let pageImages: string[] = [];
    let pageCount = 1;
    let mimeType = "image/png";

    if (isPdf) {
      pageCount = await getPdfPageCount(blueprintBuffer);
      pageImages = await renderPdfPagesToBase64(blueprintBuffer);
    } else {
      pageCount = 1;
      pageImages = [blueprintBuffer.toString("base64")];
      mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
    }

    const extraction = await extractBlueprintData(
      pageImages,
      {
        projectName: estimate.project.name,
        state: estimate.project.state,
        city: estimate.project.city,
      },
      mimeType
    );

    // Override extraction with user-supplied values
    const userMetadata = estimate.project.metadata || {};
    if (userMetadata.area) {
      extraction.totalAreaSqFt = Number(userMetadata.area);
    }
    if (userMetadata.floors) {
      extraction.floors = Number(userMetadata.floors);
    }

    const built = await buildEstimateFromExtraction(extraction, {
      state: estimate.project.state,
      city: estimate.project.city,
      currency: "USD",
      country: estimate.project.country,
      clientName: userMetadata.client_name as string,
      projectLocation: userMetadata.project_location as string,
      constructionQuality: userMetadata.quality as "Economy" | "Standard" | "Premium",
      notes: userMetadata.notes as string,
    });

    const lineItems = attachLineItemIds(estimateId, built.line_items);

    updateLocalEstimate(
      estimateId,
      {
        status: "completed",
        total_cost: built.total_cost,
        assumptions: built.assumptions,
        category_totals: built.category_totals as Record<CostCategory, number>,
        currency: built.currency,
      },
      lineItems
    );

    updateLocalJob(job.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      ai_extraction_raw: {
        ...extraction,
        country: estimate.project.country,
        clientName: userMetadata.client_name,
        projectLocation: userMetadata.project_location,
        constructionQuality: userMetadata.quality,
        notes: userMetadata.notes,
      } as unknown as Record<string, unknown>,
    });

    await incrementSubscriptionUsage(userId);

    // Save to Supabase estimates table if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { createServiceClient } = await import("@/lib/supabase/server");
        const supabase = await createServiceClient();
        if (supabase) {
          const materialBreakdown = lineItems.filter((item) => item.material_cost > 0);
          const laborBreakdown = lineItems.filter((item) => item.labor_cost > 0);

          const { error } = await supabase.from("estimates").upsert({
            id: estimateId,
            user_id: userId,
            project_name: estimate.project.name,
            project_type: estimate.project.project_type,
            blueprint_url: estimate.blueprint.storage_path,
            extracted_json: {
              ...extraction,
              country: estimate.project.country,
              clientName: userMetadata.client_name,
              projectLocation: userMetadata.project_location,
              constructionQuality: userMetadata.quality,
              notes: userMetadata.notes,
            },
            material_breakdown: materialBreakdown,
            labor_breakdown: laborBreakdown,
            total_cost: built.total_cost,
            confidence: built.assumptions.confidence_overall ?? 0.5,
            created_at: new Date().toISOString(),
          });

          if (error) {
            console.error("Supabase insert error in background job:", error.message);
          } else {
            console.log(`Saved estimate ${estimateId} to Supabase successfully.`);
          }
        }
      } catch (err) {
        console.error("Failed to save to Supabase:", err);
      }
    }

    return { pageCount, total: built.total_cost };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    updateLocalJob(job.id, {
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    });
    updateLocalEstimate(estimateId, { status: "failed" });
    throw error;
  }
}

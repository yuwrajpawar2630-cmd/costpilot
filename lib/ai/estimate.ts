import { randomUUID } from "crypto";
import { runEstimationEngine, mapCalculatedCostsToLineItems } from "@/lib/costs/estimator";
import type { FactualExtraction } from "@/lib/ai/schemas";
import type {
  BlueprintAssumptions,
  CostCategory,
  EstimateLineItem,
} from "@/types";
import { COST_CATEGORIES } from "@/types";

export interface BuiltEstimate {
  assumptions: BlueprintAssumptions;
  line_items: Omit<EstimateLineItem, "id" | "estimate_id">[];
  category_totals: Record<CostCategory, number>;
  total_cost: number;
  currency: string;
}

export async function buildEstimateFromExtraction(
  extraction: FactualExtraction,
  context: {
    state: string;
    city: string;
    currency: string;
    country?: string;
    clientName?: string;
    projectLocation?: string;
    constructionQuality?: "Economy" | "Standard" | "Premium";
    notes?: string;
  }
): Promise<BuiltEstimate> {
  const country = context.country || "usa";
  let currency = "USD";
  const code = country.toLowerCase().trim();
  if (code === "ca" || code === "canada") currency = "CAD";
  else if (code === "uk" || code === "gb" || code === "united kingdom") currency = "GBP";
  else if (code === "au" || code === "australia") currency = "AUD";

  const quality = context.constructionQuality || "Standard";

  // 1. Run the modular Estimation Engine to get formula-based costs (passing the quality)
  const costs = runEstimationEngine(extraction, country, quality);

  // 2. Generate line items using calculations and drop the temporary id / estimate_id
  const rawLineItems = mapCalculatedCostsToLineItems("dummy-id", costs, extraction);
  const line_items = rawLineItems.map(({ id, estimate_id, ...rest }) => rest);

  // 3. Compute cost category totals
  const category_totals = COST_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = line_items
          .filter((li) => li.category === cat)
          .reduce((sum, li) => sum + li.total_cost, 0);
      return acc;
    },
    {} as Record<CostCategory, number>
  );

  // 4. Map factual data to assumptions properties expected by the existing UI details page
  const assumptions: BlueprintAssumptions = {
    building_type: extraction.projectType,
    stories: extraction.floors,
    gross_sqft: extraction.totalAreaSqFt,
    foundation_type: extraction.foundationType,
    roof_type: extraction.roofType,
    room_count: extraction.rooms?.length || 0,
    visible_trades: ["concrete", "framing", "finishing", "electrical", "plumbing", "roofing"],
    missing_info: extraction.warnings || [],
    confidence_overall: Math.max(0.1, Math.round((1.0 - (extraction.warnings?.length || 0) * 0.1) * 100) / 100),
    regional_multiplier: 1.0,
    location: context.projectLocation || `${context.city}, ${context.state}`,
    summary: `${extraction.floors}-story ${extraction.projectType}, ~${extraction.totalAreaSqFt.toLocaleString()} sq ft. Foundation: ${extraction.foundationType}, Roof: ${extraction.roofType}.`,

    // Save detailed arrays/counts for metadata persistence
    room_names: extraction.rooms?.map((r) => r.name) || [],
    room_dimensions: extraction.rooms?.map((r) => `${r.name}: ${r.area} sq ft`) || [],
    wall_lengths: [`Total: ${extraction.wallLength} ft`],
    door_count: extraction.doors,
    window_count: extraction.windows,
    plumbing_fixtures: [`Total: ${extraction.plumbingFixtures}`],
    electrical_fixtures: [`Total: ${extraction.electricalFixtures}`],
    visible_notes_and_dimensions: extraction.notes || [],

    // New MVP fields
    client_name: context.clientName || "",
    construction_quality: quality,
    notes: context.notes || "",
    estimated_duration: extraction.estimatedDuration || "6 months",
    ai_recommendations: extraction.aiRecommendations || [],
  };

  return {
    assumptions,
    line_items,
    category_totals,
    total_cost: costs.grandTotal,
    currency,
  };
}

export function attachLineItemIds(
  estimateId: string,
  items: Omit<EstimateLineItem, "id" | "estimate_id">[]
): EstimateLineItem[] {
  return items.map((item) => ({
    ...item,
    id: randomUUID(),
    estimate_id: estimateId,
  }));
}

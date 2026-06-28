import regionalMultipliers from "./regional-multipliers.json";
import seedItems from "./seed-items.json";
import type { CostCategory } from "@/types";

export interface CostSearchResult {
  rate_code: string;
  name: string;
  unit: string;
  currency: string;
  total_per_unit: number;
  labor_per_unit: number;
  material_per_unit: number;
}

const EUR_TO_USD = 1.08;

export function getRegionalMultiplier(state: string): number {
  const key = state.toUpperCase();
  return (
    (regionalMultipliers as Record<string, number>)[key] ??
    (regionalMultipliers as Record<string, number>).DEFAULT ??
    1.0
  );
}

export function getSeedItem(query: string): CostSearchResult | null {
  const normalized = query.toLowerCase();
  const items = seedItems as Array<{
    query: string;
    name: string;
    unit: string;
    total_per_unit: number;
    labor_pct: number;
    material_pct: number;
  }>;

  const match =
    items.find((item) => normalized.includes(item.query)) ??
    items.find((item) => item.query.includes(normalized.split(" ")[0] ?? ""));

  if (!match) return null;

  const labor = match.total_per_unit * (match.labor_pct / 100);
  const material = match.total_per_unit * (match.material_pct / 100);

  return {
    rate_code: `SEED_${match.query}`,
    name: match.name,
    unit: match.unit,
    currency: "USD",
    total_per_unit: match.total_per_unit,
    labor_per_unit: labor,
    material_per_unit: material,
  };
}

export async function searchCostItem(
  query: string
): Promise<CostSearchResult | null> {
  const seed = getSeedItem(query);
  if (seed) return seed;

  try {
    const url = new URL("https://buildcalculator.io/api/v1/search");
    url.searchParams.set("q", query);
    url.searchParams.set("lang", "en");
    url.searchParams.set("top", "1");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return seed;

    const data = (await res.json()) as {
      results?: Array<{
        rate_code: string;
        name: string;
        unit: string;
        currency: string;
        pricing: {
          total_per_unit: number;
          labor_per_unit: number;
          material_per_unit: number;
        };
      }>;
    };

    const item = data.results?.[0];
    if (!item) return seed;

    const multiplier = item.currency === "EUR" ? EUR_TO_USD : 1;

    return {
      rate_code: item.rate_code,
      name: item.name,
      unit: item.unit,
      currency: "USD",
      total_per_unit: item.pricing.total_per_unit * multiplier,
      labor_per_unit: item.pricing.labor_per_unit * multiplier,
      material_per_unit: item.pricing.material_per_unit * multiplier,
    };
  } catch {
    return seed;
  }
}

export const CATEGORY_SEARCH_QUERIES: Record<CostCategory, string> = {
  Foundation: "concrete foundation footing",
  Concrete: "concrete slab pour",
  Steel: "structural steel reinforcement",
  Roofing: "asphalt shingle roofing",
  Plumbing: "residential plumbing rough in",
  Electrical: "residential electrical wiring",
  Finishing: "interior drywall paint finish",
  General: "general construction labor",
};

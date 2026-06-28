import type { FactualExtraction } from "@/lib/ai/schemas";
import type { EstimateLineItem, CostCategory } from "@/types";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface RateConfig {
  currency: string;
  rates: {
    materials: {
      concrete: number;
      steel: number;
      bricks: number;
      cement: number;
      sand: number;
      tiles: number;
      paint: number;
      drywall: number;
      electrical: number;
      plumbing: number;
    };
    labor: {
      mason: number;
      carpenter: number;
      electrician: number;
      plumber: number;
      painter: number;
      helpers: number;
    };
    coefficients: {
      concrete_volume_factor: number;
      steel_density_factor: number;
      bricks_per_m2: number;
      cement_per_m3_concrete: number;
      cement_per_brick: number;
      sand_per_m3_concrete: number;
      sand_per_brick: number;
      tiles_area_factor: number;
      paint_coverage_factor: number;
      drywall_wall_factor: number;
      
      mason_concrete_hours_per_m3: number;
      mason_bricks_hours_per_brick: number;
      mason_tiles_hours_per_m2: number;
      
      carpenter_steel_hours_per_kg: number;
      carpenter_drywall_hours_per_m2: number;
      carpenter_roof_hours_per_m2: number;
      
      electrician_hours_per_fixture: number;
      plumber_hours_per_fixture: number;
      painter_hours_per_liter: number;
      
      helpers_concrete_hours_per_m3: number;
      helpers_bricks_hours_per_brick: number;
      helpers_tiles_hours_per_m2: number;
      helpers_drywall_hours_per_m2: number;
    };
    equipment_daily_rate: number;
    markups: {
      overhead_rate: number;
      contingency_rate: number;
      tax_rate: number;
    };
  };
}

export const FALLBACK_USA_RATES: RateConfig = {
  currency: "USD",
  rates: {
    materials: {
      concrete: 150.00,
      steel: 1.20,
      bricks: 0.60,
      cement: 0.15,
      sand: 30.00,
      tiles: 25.00,
      paint: 8.00,
      drywall: 14.00,
      electrical: 45.00,
      plumbing: 140.00
    },
    labor: {
      mason: 40.00,
      carpenter: 38.00,
      electrician: 48.00,
      plumber: 50.00,
      painter: 32.00,
      helpers: 22.00
    },
    coefficients: {
      concrete_volume_factor: 0.12,
      steel_density_factor: 75,
      bricks_per_m2: 50,
      cement_per_m3_concrete: 300,
      cement_per_brick: 0.5,
      sand_per_m3_concrete: 0.45,
      sand_per_brick: 0.001,
      tiles_area_factor: 0.25,
      paint_coverage_factor: 8,
      drywall_wall_factor: 2,
      
      mason_concrete_hours_per_m3: 1.5,
      mason_bricks_hours_per_brick: 0.05,
      mason_tiles_hours_per_m2: 0.8,
      
      carpenter_steel_hours_per_kg: 0.04,
      carpenter_drywall_hours_per_m2: 0.3,
      carpenter_roof_hours_per_m2: 0.8,
      
      electrician_hours_per_fixture: 1.5,
      plumber_hours_per_fixture: 3.5,
      painter_hours_per_liter: 0.5,
      
      helpers_concrete_hours_per_m3: 1.0,
      helpers_bricks_hours_per_brick: 0.03,
      helpers_tiles_hours_per_m2: 0.4,
      helpers_drywall_hours_per_m2: 0.2
    },
    equipment_daily_rate: 80.00,
    markups: {
      overhead_rate: 0.10,
      contingency_rate: 0.05,
      tax_rate: 0.08
    }
  }
};

export function loadRatesForCountry(countryCode: string): RateConfig {
  const code = countryCode.toLowerCase().trim();
  let filename = "usa.json";
  if (code === "ca" || code === "canada") filename = "canada.json";
  if (code === "uk" || code === "gb" || code === "united kingdom") filename = "uk.json";
  if (code === "au" || code === "australia") filename = "australia.json";

  try {
    const ratesPath = join(process.cwd(), "rates", filename);
    if (existsSync(ratesPath)) {
      const content = readFileSync(ratesPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Failed to load rates file rates/${filename}:`, err);
  }

  return FALLBACK_USA_RATES;
}

export interface EstimatedCosts {
  // Materials
  concreteQty: number;
  concreteCost: number;
  steelQty: number;
  steelCost: number;
  bricksQty: number;
  bricksCost: number;
  cementQty: number;
  cementCost: number;
  sandQty: number;
  sandCost: number;
  tilesQty: number;
  tilesCost: number;
  paintQty: number;
  paintCost: number;
  drywallQty: number;
  drywallCost: number;
  electricalQty: number;
  electricalCost: number;
  plumbingQty: number;
  plumbingCost: number;

  // Labor Hours
  masonHours: number;
  masonCost: number;
  carpenterHours: number;
  carpenterCost: number;
  electricianHours: number;
  electricianCost: number;
  plumberHours: number;
  plumberCost: number;
  painterHours: number;
  painterCost: number;
  helpersHours: number;
  helpersCost: number;

  // Equipment & Markups
  equipmentQty: number;
  equipmentCost: number;
  overheadCost: number;
  contingencyCost: number;
  taxCost: number;
  grandTotal: number;
}

export function runEstimationEngine(
  factualData: FactualExtraction,
  countryCode: string,
  quality: "Economy" | "Standard" | "Premium" = "Standard"
): EstimatedCosts {
  const config = loadRatesForCountry(countryCode);
  const qualityMultiplier = quality === "Economy" ? 0.8 : quality === "Premium" ? 1.3 : 1.0;

  // Clone rates to avoid modifying the cached config object
  const m = { ...config.rates.materials };
  const l = { ...config.rates.labor };
  const c = config.rates.coefficients;
  const markups = config.rates.markups;

  // Apply quality multiplier to rates
  for (const k in m) {
    m[k as keyof typeof m] *= qualityMultiplier;
  }
  for (const k in l) {
    l[k as keyof typeof l] *= qualityMultiplier;
  }

  // 1. Concrete (m3)
  const totalAreaM2 = factualData.totalAreaSqFt * 0.092903;
  const concreteQty = Math.max(1, Math.round(totalAreaM2 * c.concrete_volume_factor * 100) / 100);
  const concreteCost = concreteQty * m.concrete;

  // 2. Steel (kg)
  const steelQty = Math.round(concreteQty * c.steel_density_factor);
  const steelCost = steelQty * m.steel;

  // 3. Bricks (ea)
  let wallAreaSqFt = factualData.wallLength * 9; // 9ft standard height
  if (wallAreaSqFt > 0) {
    const doorWindowDeduction = (factualData.doors * 21) + (factualData.windows * 15);
    wallAreaSqFt = Math.max(0, wallAreaSqFt - doorWindowDeduction);
  } else {
    // Heuristic if wallLength is not extracted (fallback)
    wallAreaSqFt = Math.sqrt(factualData.totalAreaSqFt) * 4 * factualData.floors * 9 * 0.5;
  }
  const wallAreaM2 = wallAreaSqFt * 0.092903;
  const bricksQty = Math.round(wallAreaM2 * c.bricks_per_m2);
  const bricksCost = bricksQty * m.bricks;

  // 4. Cement (kg)
  const cementQty = Math.round((concreteQty * c.cement_per_m3_concrete) + (bricksQty * c.cement_per_brick));
  const cementCost = cementQty * m.cement;

  // 5. Sand (m3)
  const sandQty = Math.round(((concreteQty * c.sand_per_m3_concrete) + (bricksQty * c.sand_per_brick)) * 100) / 100;
  const sandCost = sandQty * m.sand;

  // 6. Tiles (m2)
  let tiledAreaSqFt = 0;
  if (factualData.rooms && factualData.rooms.length > 0) {
    factualData.rooms.forEach((r) => {
      const nameLower = r.name.toLowerCase();
      if (
        nameLower.includes("bath") ||
        nameLower.includes("toilet") ||
        nameLower.includes("kitchen") ||
        nameLower.includes("entry") ||
        nameLower.includes("foyer") ||
        nameLower.includes("corridor")
      ) {
        tiledAreaSqFt += r.area;
      }
    });
  }
  if (tiledAreaSqFt === 0) {
    tiledAreaSqFt = factualData.totalAreaSqFt * c.tiles_area_factor;
  }
  const tilesQty = Math.round(tiledAreaSqFt * 0.092903 * 100) / 100;
  const tilesCost = tilesQty * m.tiles;

  // 7. Paint (liters)
  const paintableAreaM2 = (wallAreaM2 * 2) + totalAreaM2;
  const paintQty = Math.max(1, Math.round((paintableAreaM2 / c.paint_coverage_factor) * 100) / 100);
  const paintCost = paintQty * m.paint;

  // 8. Drywall (m2)
  const drywallQty = Math.round(wallAreaM2 * c.drywall_wall_factor * 100) / 100;
  const drywallCost = drywallQty * m.drywall;

  // 9. Electrical Materials (ea)
  const electricalQty = Math.max(1, factualData.electricalFixtures || Math.round(factualData.totalAreaSqFt / 100));
  const electricalCost = electricalQty * m.electrical;

  // 10. Plumbing Materials (ea)
  const plumbingQty = Math.max(1, factualData.plumbingFixtures || Math.round(factualData.totalAreaSqFt / 400));
  const plumbingCost = plumbingQty * m.plumbing;

  // Labor hours calculations
  // MASON
  const masonHours = Math.round(
    (concreteQty * c.mason_concrete_hours_per_m3) +
    (bricksQty * c.mason_bricks_hours_per_brick) +
    (tilesQty * c.mason_tiles_hours_per_m2)
  );
  const masonCost = masonHours * l.mason;

  // CARPENTER
  const carpenterHours = Math.round(
    (steelQty * c.carpenter_steel_hours_per_kg) +
    (drywallQty * c.carpenter_drywall_hours_per_m2) +
    (totalAreaM2 * c.carpenter_roof_hours_per_m2)
  );
  const carpenterCost = carpenterHours * l.carpenter;

  // ELECTRICIAN
  const electricianHours = Math.round(electricalQty * c.electrician_hours_per_fixture);
  const electricianCost = electricianHours * l.electrician;

  // PLUMBER
  const plumberHours = Math.round(plumbingQty * c.plumber_hours_per_fixture);
  const plumberCost = plumberHours * l.plumber;

  // PAINTER
  const painterHours = Math.round(paintQty * c.painter_hours_per_liter);
  const painterCost = painterHours * l.painter;

  // HELPERS (General construction laborers)
  const helpersHours = Math.round(
    (concreteQty * c.helpers_concrete_hours_per_m3) +
    (bricksQty * c.helpers_bricks_hours_per_brick) +
    (tilesQty * c.helpers_tiles_hours_per_m2) +
    (drywallQty * c.helpers_drywall_hours_per_m2)
  );
  const helpersCost = helpersHours * l.helpers;

  // Equipment Costs
  const equipmentQty = Math.max(1, Math.round(concreteQty * 0.2 + factualData.floors * 5));
  const equipmentCost = equipmentQty * config.rates.equipment_daily_rate;

  // Direct cost subtotal
  const directMaterials =
    concreteCost + steelCost + bricksCost + cementCost + sandCost +
    tilesCost + paintCost + drywallCost + electricalCost + plumbingCost;
  const directLabor =
    masonCost + carpenterCost + electricianCost + plumberCost + painterCost + helpersCost;
  
  const directCost = directMaterials + directLabor + equipmentCost;

  // Contractor Overhead
  const overheadCost = directCost * markups.overhead_rate;

  // Contingency
  const contingencyCost = (directCost + overheadCost) * markups.contingency_rate;

  // Taxes
  const taxCost = directMaterials * markups.tax_rate;

  // Grand Total
  const grandTotal = directCost + overheadCost + contingencyCost + taxCost;

  return {
    concreteQty,
    concreteCost,
    steelQty,
    steelCost,
    bricksQty,
    bricksCost,
    cementQty,
    cementCost,
    sandQty,
    sandCost,
    tilesQty,
    tilesCost,
    paintQty,
    paintCost,
    drywallQty,
    drywallCost,
    electricalQty,
    electricalCost,
    plumbingQty,
    plumbingCost,

    masonHours,
    masonCost,
    carpenterHours,
    carpenterCost,
    electricianHours,
    electricianCost,
    plumberHours,
    plumberCost,
    painterHours,
    painterCost,
    helpersHours,
    helpersCost,

    equipmentQty,
    equipmentCost,
    overheadCost,
    contingencyCost,
    taxCost,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

export function mapCalculatedCostsToLineItems(
  estimateId: string,
  costs: EstimatedCosts,
  factualData: FactualExtraction
): EstimateLineItem[] {
  const lineItems: Omit<EstimateLineItem, "id" | "estimate_id">[] = [];
  let sortOrder = 0;

  const addItem = (
    category: CostCategory,
    description: string,
    quantity: number,
    unit: string,
    materialCost: number,
    laborCost: number
  ) => {
    const total = materialCost + laborCost;
    if (total <= 0) return;

    const unitCost = quantity > 0 ? total / quantity : 0;

    lineItems.push({
      category,
      description,
      quantity: Math.round(quantity * 100) / 100,
      unit,
      unit_cost: Math.round(unitCost * 100) / 100,
      labor_cost: Math.round(laborCost * 100) / 100,
      material_cost: Math.round(materialCost * 100) / 100,
      total_cost: Math.round(total * 100) / 100,
      confidence: 1.0,
      sort_order: sortOrder++,
    });
  };

  // 1. Material items (material_cost > 0, labor_cost = 0)
  addItem("Foundation", "Concrete Materials (Foundation Slab)", costs.concreteQty * 0.4, "m3", costs.concreteCost * 0.4, 0);
  addItem("Concrete", "Concrete Materials (Columns & Beams)", costs.concreteQty * 0.6, "m3", costs.concreteCost * 0.6, 0);
  addItem("Foundation", "Steel Reinforcement (Foundation Rebar)", costs.steelQty * 0.4, "kg", costs.steelCost * 0.4, 0);
  addItem("Steel", "Steel Reinforcement (Superstructure Rebar)", costs.steelQty * 0.6, "kg", costs.steelCost * 0.6, 0);
  addItem("Concrete", "Clay Bricks Masonry Materials", costs.bricksQty, "ea", costs.bricksCost, 0);
  addItem("Concrete", "Portland Cement bags", costs.cementQty, "kg", costs.cementCost, 0);
  addItem("Concrete", "Washed River Sand", costs.sandQty, "m3", costs.sandCost, 0);
  addItem("Finishing", "Ceramic Floor & Wall Tiles", costs.tilesQty, "m2", costs.tilesCost, 0);
  addItem("Finishing", "Emulsion Paint cans", costs.paintQty, "liters", costs.paintCost, 0);
  addItem("Finishing", "Drywall Boards (Gypsum Plaster)", costs.drywallQty, "m2", costs.drywallCost, 0);
  addItem("Electrical", "Electrical Fixtures & Wiring Materials", costs.electricalQty, "ea", costs.electricalCost, 0);
  addItem("Plumbing", "Plumbing Fixtures & Pipes Materials", costs.plumbingQty, "ea", costs.plumbingCost, 0);

  // 2. Labor items (labor_cost > 0, material_cost = 0)
  addItem("Concrete", "Mason Labor Works", costs.masonHours, "hr", 0, costs.masonCost);
  addItem("Roofing", "Carpenter Labor Works", costs.carpenterHours, "hr", 0, costs.carpenterCost);
  addItem("Electrical", "Electrician Labor Works", costs.electricianHours, "hr", 0, costs.electricianCost);
  addItem("Plumbing", "Plumber Labor Works", costs.plumberHours, "hr", 0, costs.plumberCost);
  addItem("Finishing", "Painter Labor Works", costs.painterHours, "hr", 0, costs.painterCost);
  addItem("General", "Helpers Labor Works", costs.helpersHours, "hr", 0, costs.helpersCost);

  // 3. Equipment rental costs
  addItem("General", "Equipment Rental (Excavator & Mixer)", costs.equipmentQty, "day", costs.equipmentCost, 0);

  // 4. Contractor Overhead
  addItem("General", "Contractor Overhead & Project Management", 1, "ls", 0, costs.overheadCost);

  // 5. Contingency
  addItem("General", "Project Contingency Allowance", 1, "ls", costs.contingencyCost, 0);

  // 6. Taxes
  addItem("General", "Material Purchase Taxes & Building Permits", 1, "ls", costs.taxCost, 0);

  return lineItems.map((item) => ({
    ...item,
    id: randomUUID(),
    estimate_id: estimateId,
  }));
}

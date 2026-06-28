import { z } from "zod";
import type { CostCategory } from "@/types";
import { COST_CATEGORIES } from "@/types";

export const categoryQuantitySchema = z.object({
  category: z.enum(COST_CATEGORIES as unknown as [CostCategory, ...CostCategory[]]),
  search_query: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
});

export const blueprintExtractionSchema = z.object({
  building_type: z.string(),
  stories: z.number().int().min(1).max(5),
  gross_sqft: z.number().positive(),
  foundation_type: z.string(),
  roof_type: z.string(),
  exterior_wall: z.string(),
  garage: z.boolean(),
  room_count: z.number().int().min(1),
  visible_trades: z.array(z.string()),
  missing_info: z.array(z.string()),
  confidence_overall: z.number().min(0).max(1),
  category_quantities: z.array(categoryQuantitySchema).min(1),
  room_names: z.array(z.string()).optional(),
  room_dimensions: z.array(z.string()).optional(),
  wall_lengths: z.array(z.string()).optional(),
  door_count: z.number().int().nullable().optional(),
  window_count: z.number().int().nullable().optional(),
  plumbing_fixtures: z.array(z.string()).optional(),
  electrical_fixtures: z.array(z.string()).optional(),
  visible_notes_and_dimensions: z.array(z.string()).optional(),
});

export type BlueprintExtractionInput = z.infer<typeof blueprintExtractionSchema>;

export const EXTRACTION_SYSTEM_PROMPT = `You are a construction blueprint analyst. Extract building scope and quantity allowances from architectural floor plan images.

Rules:
- Output ONLY valid JSON matching the schema. No markdown.
- List missing_info instead of guessing dimensions not visible.
- category_quantities must cover all 8 categories: Foundation, Concrete, Steel, Roofing, Plumbing, Electrical, Finishing, General
- Quantities are allowances for costing, not engineering takeoffs.
- Never output dollar amounts — only quantities and units.
- confidence_overall reflects how readable the plans are (0-1).`;

export function buildExtractionUserPrompt(context: {
  projectName: string;
  state: string;
  city: string;
}): string {
  return `Analyze these blueprint pages for project "${context.projectName}" in ${context.city}, ${context.state}.

Return JSON with:
building_type, stories, gross_sqft, foundation_type, roof_type, exterior_wall, garage, room_count, visible_trades[], missing_info[], confidence_overall, category_quantities[{category, search_query, quantity, unit, confidence}]`;
}

export const factualRoomSchema = z.object({
  name: z.string(),
  area: z.number(),
});

export const factualExtractionSchema = z.object({
  projectType: z.string(),
  floors: z.number().int().min(1),
  totalAreaSqFt: z.number().nonnegative(),
  rooms: z.array(factualRoomSchema),
  doors: z.number().int().nonnegative(),
  windows: z.number().int().nonnegative(),
  wallLength: z.number().nonnegative(),
  roofType: z.string(),
  foundationType: z.string(),
  plumbingFixtures: z.number().int().nonnegative(),
  electricalFixtures: z.number().int().nonnegative(),
  notes: z.array(z.string()),
  warnings: z.array(z.string()),
  estimatedDuration: z.string(),
  aiRecommendations: z.array(z.string()),
});

export type FactualExtraction = z.infer<typeof factualExtractionSchema>;

export const FACTUAL_EXTRACTION_SYSTEM_PROMPT = `You are a strict, factual construction blueprint analyst. Extract ONLY factual specifications and dimensions from the provided floor plan images.

Rules:
- Output ONLY valid JSON matching the schema format. No markdown, HTML or surrounding text.
- Never invent or assume missing information. If a parameter is not visible, not specified, or cannot be determined:
  - Return 0 for counts or areas, and empty strings/arrays for text.
  - Return a detailed warning explaining what is missing in the "warnings" array.
- If your confidence is low for any extracted value, return a detailed warning in the "warnings" array.
- The "rooms" list must contain each room identified on the plan with its name and exact area in square feet. If dimensions are missing for a room, set area to 0 and add a warning.
- "wallLength" should be the sum of all visible wall length measurements in feet, or 0 if wall dimensions are not shown.
- "doors" is the count of door symbols.
- "windows" is the count of window symbols.
- "plumbingFixtures" is the count of plumbing fixtures (sinks, toilets, tubs, etc.).
- "electricalFixtures" is the count of electrical fixtures (lighting fixtures, switches, outlets, panel).
- "notes" is a list of key annotations, notes, or callouts visible on the drawing.
- "estimatedDuration" should be a realistic estimate of the construction time (e.g., "6-8 months" or "10-12 months") based on the size, floors, and complexity.
- "aiRecommendations" should be an array of 3-5 professional, actionable recommendations for cost-saving, material selection, or construction efficiency based on the plan details.`;

export function buildFactualUserPrompt(context: {
  projectName: string;
  state: string;
  city: string;
}): string {
  return `Analyze these blueprint pages for project "${context.projectName}" located in ${context.city}, ${context.state}.
  
  Extract factual parameters from the plan and return a valid JSON object matching this schema structure:
  {
    "projectType": "string",
    "floors": number,
    "totalAreaSqFt": number,
    "rooms": [
      { "name": "string", "area": number }
    ],
    "doors": number,
    "windows": number,
    "wallLength": number,
    "roofType": "string",
    "foundationType": "string",
    "plumbingFixtures": number,
    "electricalFixtures": number,
    "notes": ["string"],
    "warnings": ["string"],
    "estimatedDuration": "string",
    "aiRecommendations": ["string"]
  }`;
}

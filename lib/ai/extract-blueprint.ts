import { GoogleGenAI } from "@google/genai";
import {
  factualExtractionSchema,
  FACTUAL_EXTRACTION_SYSTEM_PROMPT,
  buildFactualUserPrompt,
  FactualExtraction,
} from "./schemas";

function buildHeuristicExtraction(context: {
  projectName: string;
  state: string;
  city: string;
}): FactualExtraction {
  const nameLower = context.projectName.toLowerCase();
  let gross_sqft = 2200;
  if (nameLower.includes("1800") || nameLower.includes("ranch")) gross_sqft = 1800;
  if (nameLower.includes("2400") || nameLower.includes("two")) gross_sqft = 2400;
  if (nameLower.includes("1600") || nameLower.includes("town")) gross_sqft = 1600;
  if (nameLower.includes("3200") || nameLower.includes("custom")) gross_sqft = 3200;
  if (nameLower.includes("600") || nameLower.includes("addition")) gross_sqft = 600;

  const floors = gross_sqft > 2500 ? 2 : nameLower.includes("two") ? 2 : 1;
  const durationMonths = Math.max(3, Math.round(4 + (gross_sqft / 600)));

  return {
    projectType: "residential single-family",
    floors,
    totalAreaSqFt: gross_sqft,
    rooms: [
      { name: "Living Room", area: Math.round(gross_sqft * 0.25) },
      { name: "Kitchen", area: Math.round(gross_sqft * 0.15) },
      { name: "Master Bedroom", area: Math.round(gross_sqft * 0.2) },
      { name: "Bathroom", area: Math.round(gross_sqft * 0.1) },
    ],
    doors: Math.max(4, Math.round(gross_sqft / 300)),
    windows: Math.max(6, Math.round(gross_sqft / 200)),
    wallLength: Math.round(Math.sqrt(gross_sqft) * 4 * floors),
    roofType: "asphalt shingle",
    foundationType: "slab-on-grade",
    plumbingFixtures: Math.max(1, Math.round(gross_sqft / 800)),
    electricalFixtures: Math.max(1, Math.round(gross_sqft / 600)),
    notes: [
      "Using heuristic extraction — set GEMINI_API_KEY for real blueprint parsing",
    ],
    warnings: [
      "This is heuristic mock data generated because no blueprint PDF/images were supplied.",
    ],
    estimatedDuration: `${durationMonths} months`,
    aiRecommendations: [
      "Consider using prefab roof trusses to reduce framing labor costs by up to 15%.",
      "Optimize plumbing layout by grouping wet walls (kitchen and bathrooms) back-to-back.",
      "Utilize energy-efficient double-pane windows to lower long-term heating/cooling costs."
    ]
  };
}

export async function extractBlueprintData(
  pageImagesBase64: string[],
  context: { projectName: string; state: string; city: string },
  mimeType = "image/png"
): Promise<FactualExtraction> {
  // If no images are provided, fall back to heuristic extraction (useful for run-validation-samples.ts)
  if (pageImagesBase64.length === 0) {
    return buildHeuristicExtraction(context);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key (GEMINI_API_KEY) is not set in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents: any[] = [
    buildFactualUserPrompt(context)
  ];

  for (const base64 of pageImagesBase64) {
    contents.push({
      inlineData: {
        mimeType,
        data: base64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: FACTUAL_EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "";
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    if (!cleanText) {
      throw new Error("Empty response from Gemini API.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      throw new Error("Failed to parse response as JSON: " + (e instanceof Error ? e.message : String(e)));
    }

    // Ensure array fields exist
    const arrayFields = ["rooms", "notes", "warnings", "aiRecommendations"];
    arrayFields.forEach((field) => {
      if (!Array.isArray(parsed[field])) {
        parsed[field] = [];
      }
    });

    // Validate using Zod schema
    const result = factualExtractionSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Zod schema validation failed on Gemini output:", result.error.format());
      throw new Error("Validation of AI output failed: " + result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; "));
    }

    return result.data;
  } catch (error) {
    console.error("Gemini blueprint extraction error:", error);
    throw new Error(error instanceof Error ? error.message : "Gemini analysis failed.");
  }
}

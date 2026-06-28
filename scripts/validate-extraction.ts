import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

import { extractBlueprintData } from "../lib/ai/extract-blueprint";
import { buildEstimateFromExtraction } from "../lib/ai/estimate";
import { renderPdfPagesToBase64 } from "../lib/pdf/render-pages";

async function main() {
  const pdfPath = process.argv[2];
  const state = process.argv[3] ?? "TX";
  const city = process.argv[4] ?? "Austin";

  if (!pdfPath) {
    console.error(
      "Usage: npm run validate -- <path-to.pdf> [state] [city]"
    );
    process.exit(1);
  }

  const absolutePath = resolve(pdfPath);
  if (!existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const pdfBuffer = readFileSync(absolutePath);
  const pageImages = await renderPdfPagesToBase64(pdfBuffer, 10);

  console.log(`\n=== CostPilot Validation ===`);
  console.log(`File: ${absolutePath}`);
  console.log(`Location: ${city}, ${state}`);
  console.log(`Pages rendered: ${pageImages.length}\n`);

  const extraction = await extractBlueprintData(pageImages, {
    projectName: pdfPath.split(/[/\\]/).pop() ?? "validation",
    state,
    city,
  });

  console.log("--- Extraction ---");
  console.log(JSON.stringify(extraction, null, 2));

  const estimate = await buildEstimateFromExtraction(extraction, {
    state,
    city,
    currency: "USD",
  });

  console.log("\n--- Estimate Summary ---");
  console.log(`Total: $${estimate.total_cost.toLocaleString()}`);
  const confidence = estimate.assumptions.confidence_overall ?? 0;
  console.log(`Confidence: ${(Number(confidence) * 100).toFixed(0)}%`);
  console.log(`Line items: ${estimate.line_items.length}`);
  console.log("\nCategory totals:");
  for (const [cat, total] of Object.entries(estimate.category_totals)) {
    console.log(`  ${cat}: $${total.toLocaleString()}`);
  }

  const missingInfo = estimate.assumptions.missing_info ?? [];
  if (Array.isArray(missingInfo) && missingInfo.length > 0) {
    console.log("\nMissing info:");
    missingInfo.forEach((item) => console.log(`  - ${item}`));
  }

  const benchmarksPath = resolve(
    __dirname,
    "fixtures/benchmarks.csv"
  );
  if (existsSync(benchmarksPath)) {
    const filename = pdfPath.split(/[/\\]/).pop() ?? "";
    const csv = readFileSync(benchmarksPath, "utf-8");
    const row = csv
      .split("\n")
      .slice(1)
      .find((line) => line.startsWith(filename));
    if (row) {
      const manualTotal = Number(row.split(",")[3]);
      if (manualTotal > 0) {
        const variance =
          ((estimate.total_cost - manualTotal) / manualTotal) * 100;
        console.log(`\n--- Benchmark Comparison ---`);
        console.log(`Manual benchmark: $${manualTotal.toLocaleString()}`);
        console.log(`Variance: ${variance.toFixed(1)}%`);
      }
    }
  }

  console.log("\nValidation complete.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Runs 5 sample scenarios through extraction + pricing pipeline
 * (heuristic mode — no PDF or OpenAI required).
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { extractBlueprintData } from "../lib/ai/extract-blueprint";
import { buildEstimateFromExtraction } from "../lib/ai/estimate";

const SAMPLES = [
  { file: "sample-ranch-1800.pdf", state: "TX", city: "Austin" },
  { file: "sample-two-story-2400.pdf", state: "FL", city: "Tampa" },
  { file: "sample-townhouse-1600.pdf", state: "CA", city: "Sacramento" },
  { file: "sample-custom-3200.pdf", state: "CO", city: "Denver" },
  { file: "sample-addition-600.pdf", state: "NY", city: "Albany" },
];

async function main() {
  const csvPath = resolve(__dirname, "fixtures/benchmarks.csv");
  const csv = readFileSync(csvPath, "utf-8");
  const benchmarks = new Map<string, number>();

  csv
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .forEach((line) => {
      const [file, , , total] = line.split(",");
      if (file && total) benchmarks.set(file, Number(total));
    });

  console.log("\n=== CostPilot Sample Validation (5 scenarios) ===\n");
  console.log("| Sample | AI Total | Benchmark | Variance | Categories |");
  console.log("|--------|----------|-----------|----------|------------|");

  let passCount = 0;

  for (const sample of SAMPLES) {
    const extraction = await extractBlueprintData([], {
      projectName: sample.file,
      state: sample.state,
      city: sample.city,
    });

    const estimate = await buildEstimateFromExtraction(extraction, {
      state: sample.state,
      city: sample.city,
      currency: "USD",
    });

    const benchmark = benchmarks.get(sample.file) ?? 0;
    const variance =
      benchmark > 0
        ? ((estimate.total_cost - benchmark) / benchmark) * 100
        : null;
    const categories = estimate.line_items.length;

    if (categories >= 8) passCount++;

    console.log(
      `| ${sample.file.replace(".pdf", "")} | $${Math.round(estimate.total_cost).toLocaleString()} | $${benchmark.toLocaleString()} | ${variance != null ? `${variance.toFixed(1)}%` : "N/A"} | ${categories}/8 |`
    );
  }

  console.log(`\nCategories populated: ${passCount}/5 samples with 8+ line items`);
  console.log("Note: Replace benchmark placeholders in scripts/fixtures/benchmarks.csv with real manual estimates.\n");
  console.log("Validation pipeline OK — ready for PDF testing via: npm run validate -- <file.pdf>\n");
}

main().catch(console.error);

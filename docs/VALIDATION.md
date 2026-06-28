# CostPilot AI — Pre-Build Validation Workflow

Run this workflow before relying on production estimates. The script `scripts/validate-extraction.ts` automates extraction + pricing against sample scenarios.

## Goal

Measure the gap between AI draft estimates and manual estimator benchmarks on **5 residential blueprint PDFs**.

## Sample test matrix

| # | Project type | Target sq ft | State | Manual benchmark source |
|---|--------------|--------------|-------|-------------------------|
| 1 | Single-family ranch | ~1,800 | TX | Contractor spreadsheet |
| 2 | Two-story suburban | ~2,400 | FL | Past bid archive |
| 3 | Townhouse | ~1,600 | CA | RSMeans ROM |
| 4 | Custom home w/ garage | ~3,200 | CO | Estimator quote |
| 5 | Small remodel addition | ~600 | NY | Change order history |

## Steps per PDF

1. Place PDF in `scripts/fixtures/blueprints/` (create folder).
2. Run: `npm run validate -- scripts/fixtures/blueprints/your-plan.pdf TX Austin`
3. Review JSON output: extracted assumptions, line items, category totals.
4. Enter manual benchmark total in `scripts/fixtures/benchmarks.csv`.
5. Record variance % = `(ai_total - manual_total) / manual_total`.

## Acceptable MVP thresholds

| Metric | Target | Action if missed |
|--------|--------|------------------|
| Extraction completes | 100% | Fix PDF pipeline |
| Sq ft within ±20% | 4/5 plans | Tune vision prompt |
| Total cost within ±35% | 3/5 plans | Improve cost mapping |
| All 8 categories populated | 100% | Fix seed + API fallback |

## Mock mode (no API keys)

Set `OPENAI_API_KEY=` empty to run heuristic extraction from filename/metadata only. Useful for CI and UI testing.

## Recording results

Copy the script output into `docs/validation-results/` as dated markdown. Do not commit customer blueprints containing PII.

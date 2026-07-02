# CostPilot AI

AI construction estimating SaaS — upload a blueprint PDF, get a draft cost estimate in minutes.

**Not** project management. **Not** takeoff software alone. End-to-end draft estimates with 8 cost categories.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Try free** → upload a PDF → get estimate.

Demo mode works with no env vars (local storage in `.data/`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run validate:samples` | Run 5 sample scenarios through AI + pricing |
| `npm run validate -- file.pdf TX Austin` | Validate a real PDF |

## Documentation

- [Setup & infrastructure](docs/SETUP.md)
- [Validation workflow](docs/VALIDATION.md)
- [Beta program](docs/BETA.md)
- [Environment variables](.env.example)

## Stack

Next.js 16 · Supabase · Inngest · OpenAI · PayPal / Razorpay · BuildCalculator.io API

## Plans

| Plan | Price | Estimates/mo |
|------|-------|--------------|
| Free | $0 | 2 |
| Starter | $49 | 15 |
| Pro | $99 | 100 |

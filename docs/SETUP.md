# CostPilot AI — Infrastructure Setup

## Quick start (demo mode)

No configuration required. Run `npm run dev` and sign up — data persists in `.data/`.

## Production checklist

### 1. Supabase
- Create project at [supabase.com](https://supabase.com)
- Run [supabase/migrations/001_initial_schema.sql](../supabase/migrations/001_initial_schema.sql)
- Create private storage bucket `blueprints`
- Copy URL + anon key + service role key to `.env.local`

### 2. Vercel
- Import repo, add env vars from `.env.example`
- Deploy

### 3. Inngest
- Create app at [inngest.com](https://inngest.com)
- Sync via `/api/inngest` after deploy
- Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

### 4. Stripe (test mode)
- Create Starter ($49) and Pro ($99) products
- Copy price IDs to `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO`
- Add webhook pointing to `/api/webhooks/stripe`
- Use test card `4242 4242 4242 4242`

### 5. OpenAI
- Add `OPENAI_API_KEY` for vision blueprint extraction

## Beta program

Beta signups stored in `.data/costpilot.json` (demo) or `beta_signups` table (Supabase).
Recruit via `/beta` page — target 20 residential GCs before Stripe live mode.

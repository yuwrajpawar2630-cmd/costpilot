# Beta Launch Guide

CostPilot AI includes a beta waitlist at `/beta` for recruiting residential GC testers.

## What's built

- **Beta signup form** → `POST /api/beta`
- Signups stored in `.data/costpilot.json` (demo) or Supabase `beta_signups` table (production)
- Target: **20 residential general contractors** before Stripe live mode

## Recruitment channels

1. Reddit: r/Construction, r/Contractor
2. Facebook groups: local contractor / builder groups
3. LinkedIn: search "residential general contractor" + "estimator"
4. Direct outreach to 10 warm contacts

## Beta offer

- Free Pro access for 60 days
- Weekly 15-min feedback call (optional)
- Logo/testimonial if satisfied

## Tracking

Check signups in demo mode:

```bash
# View beta_signups array in .data/costpilot.json
```

In Supabase:

```sql
SELECT * FROM beta_signups ORDER BY created_at DESC;
```

## Iteration loop

1. Onboard beta user → demo or Supabase account
2. Ask them to upload 1 real PDF
3. Compare output to their manual estimate
4. Tune prompts in `lib/ai/extract-blueprint.ts` and seed costs in `lib/costs/seed-items.json`
5. Re-run `npm run validate:samples` after changes

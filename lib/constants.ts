export const APP_NAME = "CostPilot AI";
export const APP_TAGLINE = "Upload plans. Get a cost estimate. Bid smarter.";
export const SUPPORT_EMAIL = "support@costpilot.ai";

export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_PAGES = 50;
export const MAX_ANALYSIS_PAGES = 10;

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "price_starter",
  pro: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise",
} as const;

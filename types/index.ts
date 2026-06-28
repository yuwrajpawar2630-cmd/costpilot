export type PlanType = "free" | "starter" | "pro" | "enterprise";

export type EstimateStatus =
  | "draft"
  | "processing"
  | "completed"
  | "failed";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type CostCategory =
  | "Foundation"
  | "Concrete"
  | "Steel"
  | "Roofing"
  | "Plumbing"
  | "Electrical"
  | "Finishing"
  | "General";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_plan: PlanType;
  subscription_status: string;
  monthly_estimate_limit: number;
  monthly_usage: number;
  billing_period_start: string;
  billing_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  project_type: string;
  country: string;
  state: string;
  city: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Blueprint {
  id: string;
  project_id: string;
  storage_path: string;
  original_filename: string;
  page_count: number;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface AnalysisJob {
  id: string;
  blueprint_id: string;
  estimate_id: string;
  status: JobStatus;
  error_message: string | null;
  ai_extraction_raw: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface EstimateLineItem {
  id: string;
  estimate_id: string;
  category: CostCategory;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  labor_cost: number;
  material_cost: number;
  total_cost: number;
  confidence: number;
  sort_order: number;
}

export interface Estimate {
  id: string;
  project_id: string;
  status: EstimateStatus;
  total_cost: number;
  currency: string;
  assumptions: BlueprintAssumptions;
  category_totals: Record<CostCategory, number>;
  report_storage_path: string | null;
  created_at: string;
}

export interface EstimateWithRelations extends Estimate {
  project: Project;
  line_items: EstimateLineItem[];
  blueprint: Blueprint | null;
  job: AnalysisJob | null;
}

export interface BlueprintAssumptions {
  building_type?: string;
  stories?: number;
  gross_sqft?: number;
  foundation_type?: string;
  roof_type?: string;
  exterior_wall?: string;
  garage?: boolean;
  room_count?: number;
  visible_trades?: string[];
  missing_info?: string[];
  confidence_overall?: number;
  summary?: string;
  regional_multiplier?: number;
  [key: string]: unknown;
}

export interface CategoryQuantity {
  category: CostCategory;
  search_query: string;
  quantity: number;
  unit: string;
  confidence: number;
}

export interface BlueprintExtraction {
  building_type: string;
  stories: number;
  gross_sqft: number;
  foundation_type: string;
  roof_type: string;
  exterior_wall: string;
  garage: boolean;
  room_count: number;
  visible_trades: string[];
  missing_info: string[];
  confidence_overall: number;
  category_quantities: CategoryQuantity[];
  room_names?: string[];
  room_dimensions?: string[];
  wall_lengths?: string[];
  door_count?: number | null;
  window_count?: number | null;
  plumbing_fixtures?: string[];
  electrical_fixtures?: string[];
  visible_notes_and_dimensions?: string[];
}

export interface BetaSignup {
  id: string;
  email: string;
  company_name: string | null;
  role: string | null;
  created_at: string;
}

export const COST_CATEGORIES: CostCategory[] = [
  "Foundation",
  "Concrete",
  "Steel",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Finishing",
  "General",
];

export const PLAN_LIMITS: Record<
  PlanType,
  { limit: number; price: number; label: string }
> = {
  free: { limit: 2, price: 0, label: "Free" },
  starter: { limit: 15, price: 49, label: "Starter" },
  pro: { limit: 100, price: 99, label: "Pro" },
  enterprise: { limit: 999999, price: 199, label: "Enterprise" },
};

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

export const ESTIMATE_DISCLAIMER =
  "DRAFT ESTIMATE — NOT FOR CONSTRUCTION. This AI-generated estimate is for planning purposes only. It is not a bid, contract, or substitute for a licensed professional estimator. Verify all quantities and costs before submitting any bid.";

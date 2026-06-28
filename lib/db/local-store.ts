import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type {
  Profile,
  Subscription,
  Project,
  Blueprint,
  Estimate,
  EstimateLineItem,
  AnalysisJob,
  EstimateWithRelations,
  BetaSignup,
  PlanType,
  CostCategory,
} from "@/types";
import { PLAN_LIMITS, COST_CATEGORIES } from "@/types";

const DATA_DIR = join(/* turbopackIgnore: true */ process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "costpilot.json");
const UPLOADS_DIR = join(DATA_DIR, "uploads");
const REPORTS_DIR = join(DATA_DIR, "reports");

export const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000001";

interface LocalDatabase {
  profiles: Profile[];
  subscriptions: Subscription[];
  projects: Project[];
  blueprints: Blueprint[];
  estimates: Estimate[];
  line_items: EstimateLineItem[];
  jobs: AnalysisJob[];
  beta_signups: BetaSignup[];
}

function ensureDirs() {
  [DATA_DIR, UPLOADS_DIR, REPORTS_DIR].forEach((dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });
}

function defaultDb(): LocalDatabase {
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    profiles: [
      {
        id: DEMO_USER_ID,
        email: "demo@costpilot.ai",
        name: "Demo User",
        company_name: "Demo Construction Co.",
        stripe_customer_id: null,
        created_at: now.toISOString(),
      },
    ],
    subscriptions: [
      {
        user_id: DEMO_USER_ID,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_plan: "free",
        subscription_status: "active",
        monthly_estimate_limit: PLAN_LIMITS.free.limit,
        monthly_usage: 0,
        billing_period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        billing_period_end: periodEnd.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ],
    projects: [],
    blueprints: [],
    estimates: [],
    line_items: [],
    jobs: [],
    beta_signups: [],
  };
}

function loadDb(): LocalDatabase {
  ensureDirs();
  if (!existsSync(DB_FILE)) {
    const db = defaultDb();
    saveDb(db);
    return db;
  }
  return JSON.parse(readFileSync(DB_FILE, "utf-8")) as LocalDatabase;
}

function saveDb(db: LocalDatabase) {
  ensureDirs();
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

export function getReportsDir() {
  ensureDirs();
  return REPORTS_DIR;
}

export function getLocalProfile(userId: string): Profile | null {
  const db = loadDb();
  return db.profiles.find((p) => p.id === userId) ?? null;
}

export function getLocalSubscription(userId: string): Subscription | null {
  const db = loadDb();
  return db.subscriptions.find((s) => s.user_id === userId) ?? null;
}

export function canCreateEstimate(userId: string): {
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanType;
} {
  // If Development Mode is enabled, bypass all limits
  if (process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === "true") {
    return { allowed: true, used: 0, limit: 999999, plan: "enterprise" };
  }

  const sub = getLocalSubscription(userId);
  if (!sub) {
    return { allowed: true, used: 0, limit: PLAN_LIMITS.free.limit, plan: "free" };
  }
  return {
    allowed: sub.monthly_usage < sub.monthly_estimate_limit,
    used: sub.monthly_usage,
    limit: sub.monthly_estimate_limit,
    plan: sub.current_plan,
  };
}

export function incrementEstimateUsage(userId: string) {
  const db = loadDb();
  const sub = db.subscriptions.find((s) => s.user_id === userId);
  if (sub) {
    sub.monthly_usage += 1;
    sub.updated_at = new Date().toISOString();
    saveDb(db);
  }
}

export function updateLocalSubscription(
  userId: string,
  plan: PlanType,
  stripeCustomerId?: string
) {
  const db = loadDb();
  let sub = db.subscriptions.find((s) => s.user_id === userId);
  const profile = db.profiles.find((p) => p.id === userId);

  if (profile && stripeCustomerId) {
    profile.stripe_customer_id = stripeCustomerId;
  }

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (!sub) {
    // If no subscription exists locally, create one
    sub = {
      user_id: userId,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: null,
      current_plan: plan,
      subscription_status: "active",
      monthly_estimate_limit: PLAN_LIMITS[plan].limit,
      monthly_usage: 0,
      billing_period_start: now.toISOString(),
      billing_period_end: periodEnd.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    db.subscriptions.push(sub);
  } else {
    sub.current_plan = plan;
    sub.monthly_estimate_limit = PLAN_LIMITS[plan].limit;
    sub.subscription_status = "active";
    if (stripeCustomerId) {
      sub.stripe_customer_id = stripeCustomerId;
    }
    sub.updated_at = now.toISOString();
  }

  saveDb(db);
}

export function updateLocalSubscriptionDetail(
  userId: string,
  updates: Partial<Subscription>
) {
  const db = loadDb();
  let sub = db.subscriptions.find((s) => s.user_id === userId);
  const now = new Date();

  if (!sub) {
    sub = {
      user_id: userId,
      stripe_customer_id: updates.stripe_customer_id || null,
      stripe_subscription_id: updates.stripe_subscription_id || null,
      current_plan: updates.current_plan || "free",
      subscription_status: updates.subscription_status || "active",
      monthly_estimate_limit: updates.monthly_estimate_limit || PLAN_LIMITS.free.limit,
      monthly_usage: updates.monthly_usage || 0,
      billing_period_start: updates.billing_period_start || now.toISOString(),
      billing_period_end: updates.billing_period_end || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    db.subscriptions.push(sub);
  } else {
    Object.assign(sub, updates);
    sub.updated_at = now.toISOString();
  }

  saveDb(db);
}

export function listLocalEstimates(userId: string): EstimateWithRelations[] {
  const db = loadDb();
  const projects = db.projects.filter((p) => p.user_id === userId);
  const projectIds = new Set(projects.map((p) => p.id));

  return db.estimates
    .filter((e) => projectIds.has(e.project_id))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((estimate) => buildEstimateWithRelations(db, estimate));
}

export function getLocalEstimate(
  estimateId: string,
  userId: string
): EstimateWithRelations | null {
  const db = loadDb();
  const estimate = db.estimates.find((e) => e.id === estimateId);
  if (!estimate) return null;

  const project = db.projects.find((p) => p.id === estimate.project_id);
  if (!project || project.user_id !== userId) return null;

  return buildEstimateWithRelations(db, estimate);
}

function buildEstimateWithRelations(
  db: LocalDatabase,
  estimate: Estimate
): EstimateWithRelations {
  const project = db.projects.find((p) => p.id === estimate.project_id)!;
  const blueprint =
    db.blueprints.find((b) => b.project_id === project.id) ?? null;
  const job =
    db.jobs.find((j) => j.estimate_id === estimate.id) ??
    null;

  return {
    ...estimate,
    project,
    line_items: db.line_items
      .filter((li) => li.estimate_id === estimate.id)
      .sort((a, b) => a.sort_order - b.sort_order),
    blueprint,
    job,
  };
}

export function createLocalEstimate(input: {
  userId: string;
  name: string;
  clientName: string;
  projectLocation: string;
  buildingType: string;
  area: number;
  floors: number;
  quality: "Economy" | "Standard" | "Premium";
  notes?: string;
  filename: string;
  fileBuffer: Buffer;
  country?: string;
  state?: string;
  city?: string;
}): EstimateWithRelations {
  const db = loadDb();
  const now = new Date().toISOString();
  const projectId = randomUUID();
  const blueprintId = randomUUID();
  const estimateId = randomUUID();
  
  const extension = input.filename.split(".").pop() || "pdf";
  const storageName = `${projectId}.${extension}`;
  const storagePath = join("uploads", storageName);

  writeFileSync(join(UPLOADS_DIR, storageName), input.fileBuffer);

  let city = input.city || "Austin";
  let state = input.state || "TX";
  let country = input.country || "USA";

  if (input.projectLocation) {
    const parts = input.projectLocation.split(",").map((p) => p.trim());
    if (parts.length >= 1) city = parts[0];
    if (parts.length >= 2) state = parts[1];
    if (parts.length >= 3) country = parts[2];
  }

  const project: Project = {
    id: projectId,
    user_id: input.userId,
    name: input.name,
    project_type: input.buildingType,
    country: country.toUpperCase(),
    state: state,
    city: city,
    metadata: {
      client_name: input.clientName,
      project_location: input.projectLocation,
      area: input.area,
      floors: input.floors,
      quality: input.quality,
      notes: input.notes || "",
    },
    created_at: now,
  };

  const blueprint: Blueprint = {
    id: blueprintId,
    project_id: projectId,
    storage_path: storagePath,
    original_filename: input.filename,
    page_count: 1,
    file_size_bytes: input.fileBuffer.length,
    uploaded_at: now,
  };

  const estimate: Estimate = {
    id: estimateId,
    project_id: projectId,
    status: "draft",
    total_cost: 0,
    currency: "USD",
    assumptions: {
      client_name: input.clientName,
      project_location: input.projectLocation,
      building_type: input.buildingType,
      gross_sqft: input.area,
      stories: input.floors,
      construction_quality: input.quality,
      notes: input.notes || "",
    },
    category_totals: {
      Foundation: 0,
      Concrete: 0,
      Steel: 0,
      Roofing: 0,
      Plumbing: 0,
      Electrical: 0,
      Finishing: 0,
      General: 0,
    },
    report_storage_path: null,
    created_at: now,
  };

  const job: AnalysisJob = {
    id: randomUUID(),
    blueprint_id: blueprintId,
    estimate_id: estimateId,
    status: "pending",
    error_message: null,
    ai_extraction_raw: null,
    started_at: null,
    completed_at: null,
  };

  db.projects.push(project);
  db.blueprints.push(blueprint);
  db.estimates.push(estimate);
  db.jobs.push(job);
  saveDb(db);

  return buildEstimateWithRelations(db, estimate);
}

export function updateLocalJob(
  jobId: string,
  updates: Partial<AnalysisJob>
) {
  const db = loadDb();
  const job = db.jobs.find((j) => j.id === jobId);
  if (job) {
    Object.assign(job, updates);
    saveDb(db);
  }
}

export function updateLocalEstimate(
  estimateId: string,
  updates: Partial<Estimate>,
  lineItems?: EstimateLineItem[]
) {
  const db = loadDb();
  const estimate = db.estimates.find((e) => e.id === estimateId);
  if (!estimate) return;

  Object.assign(estimate, updates);

  if (lineItems) {
    db.line_items = db.line_items.filter(
      (li) => li.estimate_id !== estimateId
    );
    db.line_items.push(...lineItems);
  }

  saveDb(db);
}

export function deleteLocalEstimate(estimateId: string, userId: string) {
  const db = loadDb();
  const estimate = db.estimates.find((e) => e.id === estimateId);
  if (!estimate) return false;

  const project = db.projects.find((p) => p.id === estimate.project_id);
  if (!project || project.user_id !== userId) return false;

  db.estimates = db.estimates.filter((e) => e.id !== estimateId);
  db.line_items = db.line_items.filter((li) => li.estimate_id !== estimateId);
  db.jobs = db.jobs.filter((j) => j.estimate_id !== estimateId);
  db.blueprints = db.blueprints.filter((b) => b.project_id !== project.id);
  db.projects = db.projects.filter((p) => p.id !== project.id);
  saveDb(db);
  return true;
}

export function getLocalBlueprintBuffer(blueprint: Blueprint): Buffer | null {
  const filePath = join(DATA_DIR, blueprint.storage_path);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath);
}

export function addBetaSignup(input: {
  email: string;
  company_name?: string;
  role?: string;
}): BetaSignup {
  const db = loadDb();
  const signup: BetaSignup = {
    id: randomUUID(),
    email: input.email,
    company_name: input.company_name ?? null,
    role: input.role ?? null,
    created_at: new Date().toISOString(),
  };
  db.beta_signups.push(signup);
  saveDb(db);
  return signup;
}

export function listBetaSignups(): BetaSignup[] {
  return loadDb().beta_signups;
}

export function getLocalJobByEstimateId(
  estimateId: string
): AnalysisJob | null {
  const db = loadDb();
  return db.jobs.find((j) => j.estimate_id === estimateId) ?? null;
}

export function mapSupabaseEstimateToRelation(dbEstimate: any): EstimateWithRelations {
  const lineItems = [
    ...(Array.isArray(dbEstimate.material_breakdown) ? dbEstimate.material_breakdown : []),
    ...(Array.isArray(dbEstimate.labor_breakdown) ? dbEstimate.labor_breakdown : []),
  ];

  const countryCode = (dbEstimate.extracted_json?.country || "US").toUpperCase();
  let currency = "USD";
  if (countryCode === "CA" || countryCode === "CANADA") currency = "CAD";
  else if (countryCode === "UK" || countryCode === "GB" || countryCode === "UNITED KINGDOM") currency = "GBP";
  else if (countryCode === "AU" || countryCode === "AUSTRALIA") currency = "AUD";

  const mapped: EstimateWithRelations = {
    id: dbEstimate.id,
    project_id: dbEstimate.id,
    status: "completed",
    total_cost: Number(dbEstimate.total_cost),
    currency,
    report_storage_path: null,
    created_at: dbEstimate.created_at,
    project: {
      id: dbEstimate.id,
      user_id: dbEstimate.user_id,
      name: dbEstimate.project_name,
      project_type: dbEstimate.project_type,
      country: countryCode,
      state: dbEstimate.extracted_json?.projectLocation?.split(",")[1]?.trim() || "TX",
      city: dbEstimate.extracted_json?.projectLocation?.split(",")[0]?.trim() || "Austin",
      metadata: {
        client_name: dbEstimate.extracted_json?.clientName || "",
        project_location: dbEstimate.extracted_json?.projectLocation || "",
        area: dbEstimate.extracted_json?.totalAreaSqFt || 2000,
        floors: dbEstimate.extracted_json?.floors || 1,
        quality: dbEstimate.extracted_json?.constructionQuality || "Standard",
        notes: dbEstimate.extracted_json?.notes || "",
      },
      created_at: dbEstimate.created_at,
    },
    line_items: lineItems.map((li: any, index: number) => ({
      ...li,
      id: li.id || `item-${index}`,
      estimate_id: dbEstimate.id,
    })),
    blueprint: {
      id: dbEstimate.id,
      project_id: dbEstimate.id,
      storage_path: dbEstimate.blueprint_url,
      original_filename: dbEstimate.blueprint_url.split("/").pop() ?? "blueprint.pdf",
      page_count: 1,
      file_size_bytes: 100000,
      uploaded_at: dbEstimate.created_at,
    },
    job: {
      id: dbEstimate.id,
      blueprint_id: dbEstimate.id,
      estimate_id: dbEstimate.id,
      status: "completed",
      error_message: null,
      ai_extraction_raw: dbEstimate.extracted_json || {},
      started_at: dbEstimate.created_at,
      completed_at: dbEstimate.created_at,
    },
    assumptions: {
      building_type: dbEstimate.project_type,
      stories: dbEstimate.extracted_json?.floors ?? 1,
      gross_sqft: dbEstimate.extracted_json?.totalAreaSqFt ?? 2000,
      foundation_type: dbEstimate.extracted_json?.foundationType ?? "slab",
      roof_type: dbEstimate.extracted_json?.roofType ?? "shingle",
      room_count: dbEstimate.extracted_json?.rooms?.length ?? 0,
      visible_trades: ["concrete", "framing", "finishing", "electrical", "plumbing", "roofing"],
      missing_info: dbEstimate.extracted_json?.warnings || [],
      confidence_overall: Number(dbEstimate.confidence),
      summary: `${dbEstimate.extracted_json?.floors ?? 1}-story ${dbEstimate.project_type}, ~${(dbEstimate.extracted_json?.totalAreaSqFt ?? 2000).toLocaleString()} sq ft. Foundation: ${dbEstimate.extracted_json?.foundationType ?? "slab"}, Roof: ${dbEstimate.extracted_json?.roofType ?? "shingle"}.`,
      room_names: dbEstimate.extracted_json?.rooms?.map((r: any) => r.name) || [],
      room_dimensions: dbEstimate.extracted_json?.rooms?.map((r: any) => `${r.name}: ${r.area} sq ft`) || [],
      wall_lengths: [`Total: ${dbEstimate.extracted_json?.wallLength ?? 0} ft`],
      door_count: dbEstimate.extracted_json?.doors ?? 0,
      window_count: dbEstimate.extracted_json?.windows ?? 0,
      plumbing_fixtures: [`Total: ${dbEstimate.extracted_json?.plumbingFixtures ?? 0}`],
      electrical_fixtures: [`Total: ${dbEstimate.extracted_json?.electricalFixtures ?? 0}`],
      visible_notes_and_dimensions: dbEstimate.extracted_json?.notes || [],
      
      // New MVP fields
      client_name: dbEstimate.extracted_json?.clientName || "",
      project_location: dbEstimate.extracted_json?.projectLocation || "",
      construction_quality: dbEstimate.extracted_json?.constructionQuality || "Standard",
      notes: dbEstimate.extracted_json?.notes || "",
      estimated_duration: dbEstimate.extracted_json?.estimatedDuration || "6 months",
      ai_recommendations: dbEstimate.extracted_json?.aiRecommendations || [],
    },
    category_totals: {} as any,
  };

  mapped.category_totals = COST_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = mapped.line_items
      .filter((li) => li.category === cat)
      .reduce((sum, li) => sum + li.total_cost, 0);
    return acc;
  }, {} as Record<CostCategory, number>);

  return mapped;
}

export async function getBlueprintFile(estimateId: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  const fs = require("fs");
  const path = require("path");
  const dir = path.join(process.cwd(), ".data", "blueprints");

  // 1. Check local cache first
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const file = files.find((f: string) => f.startsWith(estimateId));
    if (file) {
      const buffer = fs.readFileSync(path.join(dir, file));
      let contentType = "application/pdf";
      const ext = path.extname(file).toLowerCase();
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      
      return { buffer, contentType, filename: file };
    }
  }

  // 2. Fallback to Supabase Storage if configured
  const { isSupabaseConfigured } = require("@/lib/supabase/client");
  if (isSupabaseConfigured()) {
    const { createServiceClient } = require("@/lib/supabase/server");
    const supabase = await createServiceClient();
    if (supabase) {
      // List files in bucket matching estimateId
      const { data: files, error: listError } = await supabase.storage
        .from("blueprints")
        .list("", { search: estimateId });

      if (listError) {
        console.error("Error listing blueprints in Supabase Storage:", listError.message);
        return null;
      }

      const fileInfo = files?.find((f: any) => f.name.startsWith(estimateId));
      if (fileInfo) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("blueprints")
          .download(fileInfo.name);

        if (downloadError) {
          console.error("Error downloading blueprint from Supabase Storage:", downloadError.message);
          return null;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let contentType = fileData.type || "application/pdf";
        const ext = path.extname(fileInfo.name).toLowerCase();
        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";

        // Cache locally for future requests
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, fileInfo.name), buffer);

        return { buffer, contentType, filename: fileInfo.name };
      }
    }
  }

  return null;
}

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_USER_ID, getLocalProfile, getLocalSubscription } from "@/lib/db/local-store";
import { PLAN_LIMITS, type Profile, type Subscription, type PlanType } from "@/types";

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    return cookieStore.get("costpilot_demo_user")?.value ?? DEMO_USER_ID;
  }

  const supabase = await createClient();
  if (!supabase) return DEMO_USER_ID;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    return getLocalProfile(userId);
  }
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) {
    return getLocalSubscription(userId);
  }
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function checkEstimateUsage(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanType;
}> {
  if (!isDemoMode()) {
    const supabase = await createClient();
    if (supabase) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (sub) {
        const plan = sub.current_plan as PlanType;
        const limit = sub.monthly_estimate_limit;
        const usage = sub.monthly_usage;
        const allowed = usage < limit;
        
        return {
          allowed,
          used: usage,
          limit,
          plan,
        };
      }
    }
  }

  // Fallback to local store
  const { canCreateEstimate } = await import("@/lib/db/local-store");
  return canCreateEstimate(userId);
}

export async function incrementSubscriptionUsage(userId: string) {
  // 1. Increment in local store
  const { incrementEstimateUsage } = await import("@/lib/db/local-store");
  incrementEstimateUsage(userId);

  // 2. Increment in Supabase
  if (!isDemoMode()) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    if (supabase) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("monthly_usage")
        .eq("user_id", userId)
        .maybeSingle();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({
            monthly_usage: (sub.monthly_usage || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        // If no subscription record exists, create one with 1 usage
        await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            current_plan: "free",
            subscription_status: "active",
            monthly_estimate_limit: PLAN_LIMITS.free.limit,
            monthly_usage: 1,
            billing_period_start: new Date().toISOString(),
            billing_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    }
  }
}

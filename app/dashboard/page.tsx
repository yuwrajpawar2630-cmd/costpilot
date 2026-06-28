import Link from "next/link";
import { requireUserId, isDemoMode, getUserProfile, getUserSubscription } from "@/lib/auth/session";
import type { EstimateWithRelations } from "@/types";
import {
  listLocalEstimates,
  mapSupabaseEstimateToRelation,
} from "@/lib/db/local-store";
import { formatCurrency, StatusBadge } from "@/components/estimates/shared";
import { createClient } from "@/lib/supabase/server";
import { BillingButton } from "@/components/billing/billing-button";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const profile = await getUserProfile(userId);
  const userName = profile?.name || "Estimator";
  const sub = await getUserSubscription(userId);

  let estimates: EstimateWithRelations[] = [];
  let dbError: string | null = null;

  try {
    if (!isDemoMode()) {
      const supabase = await createClient();
      if (!supabase) {
        dbError = "Supabase client failed to initialize. Check environment variables.";
      } else {
        // Ensure profile exists in profiles table for foreign key requirements
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !profile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.user_metadata?.full_name || "",
            created_at: new Date().toISOString(),
          });
        }

        const { data, error } = await supabase
          .from("estimates")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          dbError = error.message;
        } else if (data) {
          estimates = data.map(mapSupabaseEstimateToRelation);
        }
      }
    } else {
      estimates = listLocalEstimates(userId);
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Failed to connect to backend.";
  }

  // Calculate subscription stats
  const currentPlan = sub?.current_plan || "free";
  const monthlyUsage = sub?.monthly_usage || 0;
  const monthlyLimit = sub?.monthly_estimate_limit ?? 2;
  const remainingAnalyses = Math.max(0, monthlyLimit - monthlyUsage);

  const hasSubscription = Boolean(sub?.stripe_customer_id);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Welcome back, {userName}!
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here is a summary of your construction estimates and subscription.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BillingButton hasSubscription={hasSubscription} />
          <Link
            href="/dashboard/estimates/new"
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm transition-colors"
          >
            New Estimate
          </Link>
        </div>
      </div>

      {dbError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span className="font-semibold">Database Error:</span> {dbError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Current Plan</p>
          <p className="mt-1.5 text-2xl font-black text-zinc-900 capitalize">
            {currentPlan}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Used Analyses</p>
          <p className="mt-1.5 text-2xl font-black text-zinc-900">
            {monthlyUsage} / {monthlyLimit}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Remaining Analyses</p>
          <p className="mt-1.5 text-2xl font-black text-zinc-900">
            {remainingAnalyses}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total Estimates</p>
          <p className="mt-1.5 text-2xl font-black text-zinc-900">{estimates.length}</p>
        </div>
      </div>

      {/* Recent Estimates Section */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Recent Estimates</h2>
        {estimates.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-zinc-500">No estimates generated yet.</p>
            <Link
              href="/dashboard/estimates/new"
              className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:underline"
            >
              Create your first estimate →
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {estimates.slice(0, 10).map((est) => (
                    <tr key={est.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/estimates/${est.id}`}
                          className="font-semibold text-orange-600 hover:underline"
                        >
                          {est.project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-700">
                        {((est.assumptions?.client_name || "—") as string)}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">
                        {((est.assumptions?.project_location || `${est.project.city}, ${est.project.state}`) as string)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={est.status} />
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-900 tabular-nums">
                        {est.status === "completed"
                          ? formatCurrency(est.total_cost, est.currency)
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap">
                        {new Date(est.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

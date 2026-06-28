import Link from "next/link";
import { requireUserId, isDemoMode } from "@/lib/auth/session";
import type { EstimateWithRelations } from "@/types";
import { listLocalEstimates, mapSupabaseEstimateToRelation } from "@/lib/db/local-store";
import { formatCurrency, StatusBadge } from "@/components/estimates/shared";
import { createClient } from "@/lib/supabase/server";

export default async function EstimatesPage() {
  const userId = await requireUserId();
  let estimates: EstimateWithRelations[] = [];
  let dbError: string | null = null;

  try {
    if (!isDemoMode()) {
      const supabase = await createClient();
      if (!supabase) {
        dbError = "Supabase client failed to initialize. Check environment variables.";
      } else {
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
    dbError = err instanceof Error ? err.message : "Failed to load estimates.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Estimates</h1>
          <p className="mt-1 text-sm text-zinc-500">View and manage your previous construction estimates.</p>
        </div>
        <Link
          href="/dashboard/estimates/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm transition-colors"
        >
          New Estimate
        </Link>
      </div>

      {dbError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span className="font-semibold">Database Error:</span> {dbError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {estimates.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-zinc-500">No estimates yet.</p>
            <Link
              href="/dashboard/estimates/new"
              className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:underline"
            >
              Create your first estimate →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {estimates.map((est) => (
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
                      {(est.assumptions?.client_name as string) || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {(est.assumptions?.project_location as string) || `${est.project.city}, ${est.project.state}`}
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
        )}
      </div>
    </div>
  );
}

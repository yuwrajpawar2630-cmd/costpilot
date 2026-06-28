import { notFound } from "next/navigation";
import { requireUserId, isDemoMode } from "@/lib/auth/session";
import type { EstimateWithRelations } from "@/types";
import { getLocalEstimate, mapSupabaseEstimateToRelation } from "@/lib/db/local-store";
import { EstimateDetailClient } from "@/components/estimates/estimate-detail";
import { createClient } from "@/lib/supabase/server";

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;
  let estimate: EstimateWithRelations | null = null;

  if (!isDemoMode()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        estimate = mapSupabaseEstimateToRelation(data);
      }
    }
  }

  if (!estimate) {
    estimate = getLocalEstimate(id, userId);
  }

  if (!estimate) notFound();

  return <EstimateDetailClient initialEstimate={estimate} />;
}

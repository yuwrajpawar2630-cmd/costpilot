import { NewEstimateForm } from "@/components/estimates/new-estimate-form";
import { requireUserId, checkEstimateUsage } from "@/lib/auth/session";

export default async function NewEstimatePage() {
  const userId = await requireUserId();
  const usage = await checkEstimateUsage(userId);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">New estimate</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Upload a blueprint PDF and we&apos;ll generate a draft cost estimate.
      </p>
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <NewEstimateForm 
          allowed={usage.allowed} 
          used={usage.used} 
          limit={usage.limit} 
        />
      </div>
    </div>
  );
}

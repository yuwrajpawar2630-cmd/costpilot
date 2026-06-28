import { ESTIMATE_DISCLAIMER } from "@/types";
import { formatCurrency } from "@/components/estimates/shared";

export default function SampleReportPage() {
  const sample = {
    project: "Sample Residence — 2,200 sq ft",
    location: "Austin, TX",
    total: 487500,
    categories: {
      Foundation: 42000,
      Concrete: 38500,
      Steel: 22000,
      Roofing: 31500,
      Plumbing: 48000,
      Electrical: 52000,
      Finishing: 185000,
      General: 68500,
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Sample draft estimate</h1>
      <p className="mt-2 text-zinc-600">
        Example output for a residential new build (illustrative only).
      </p>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-zinc-500">CostPilot AI — Draft Estimate</p>
        <h2 className="mt-2 text-xl font-semibold">{sample.project}</h2>
        <p className="text-sm text-zinc-500">{sample.location}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(sample.categories).map(([cat, amount]) => (
            <div key={cat} className="flex justify-between border-b border-zinc-100 py-2 text-sm">
              <span>{cat}</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between border-t-2 border-zinc-900 pt-4 text-lg font-bold">
          <span>Total estimated cost</span>
          <span>{formatCurrency(sample.total)}</span>
        </div>

        <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          {ESTIMATE_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

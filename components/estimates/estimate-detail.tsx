"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EstimateWithRelations } from "@/types";
import { COST_CATEGORIES } from "@/types";
import {
  DisclaimerBanner,
  formatCurrency,
  StatusBadge,
} from "@/components/estimates/shared";

export function EstimateDetailClient({
  initialEstimate,
}: {
  initialEstimate: EstimateWithRelations;
}) {
  const router = useRouter();
  const [estimate, setEstimate] = useState(initialEstimate);
  const [deleting, setDeleting] = useState(false);
  const [polling, setPolling] = useState(
    initialEstimate.status === "processing" ||
      initialEstimate.status === "draft"
  );

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/estimates/${estimate.id}/status`);
      const data = await res.json();

      if (data.status === "completed" || data.status === "failed") {
        setPolling(false);
        router.refresh();
        const full = await fetch(`/api/estimates/${estimate.id}`);
        const fullData = await full.json();
        if (fullData.estimate) setEstimate(fullData.estimate);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, estimate.id, router]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this estimate?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete estimate");
        setDeleting(false);
      }
    } catch (err) {
      alert("Something went wrong");
      setDeleting(false);
    }
  }

  if (estimate.status === "processing" || estimate.status === "draft") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        <h2 className="text-lg font-semibold">Analyzing your blueprint…</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Reading plans → extracting scope → calculating costs
        </p>
      </div>
    );
  }

  if (estimate.status === "failed") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Analysis failed</h2>
        <p className="mt-2 text-sm text-red-700">
          {estimate.job?.error_message ?? "Unknown error"}
        </p>
        <Link
          href="/dashboard/estimates/new"
          className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Try Again
        </Link>
      </div>
    );
  }

  // Calculate Cost Breakdown
  const materialCost = estimate.line_items
    .filter((item) => item.material_cost > 0)
    .reduce((sum, item) => sum + item.material_cost, 0);

  const laborCost = estimate.line_items
    .filter((item) => item.labor_cost > 0)
    .reduce((sum, item) => sum + item.labor_cost, 0);

  const equipmentCost = estimate.line_items
    .filter((item) => item.description.toLowerCase().includes("equipment"))
    .reduce((sum, item) => sum + item.total_cost, 0);

  const miscCost = Math.max(0, estimate.total_cost - materialCost - laborCost - equipmentCost);

  const isImage =
    estimate.blueprint?.original_filename.toLowerCase().endsWith(".png") ||
    estimate.blueprint?.original_filename.toLowerCase().endsWith(".jpg") ||
    estimate.blueprint?.original_filename.toLowerCase().endsWith(".jpeg");

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            {estimate.project.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>{((estimate.assumptions?.location || `${estimate.project.city}, ${estimate.project.state}`) as string)}</span>
            <span>•</span>
            <span className="capitalize">{estimate.project.project_type}</span>
            <span>•</span>
            <span>Created {new Date(estimate.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <StatusBadge status={estimate.status} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Estimated Cost</p>
          <p className="text-4xl font-black tracking-tight text-zinc-900 mt-1">
            {formatCurrency(estimate.total_cost, estimate.currency)}
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Blueprint & Tables */}
        <div className="space-y-6 lg:col-span-8">
          {/* Blueprint Preview Container */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900">Blueprint Preview</h2>
              <a
                href={`/api/estimates/${estimate.id}/blueprint`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Open Fullscreen ↗
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 aspect-[4/3] w-full flex items-center justify-center">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/estimates/${estimate.id}/blueprint`}
                  alt="Blueprint Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <iframe
                  src={`/api/estimates/${estimate.id}/blueprint`}
                  className="h-full w-full border-0"
                  title="Blueprint PDF Preview"
                />
              )}
            </div>
          </div>

          {/* Materials Table Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Materials Estimate</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Material Description</th>
                    <th className="pb-3 pr-4 text-right">Qty</th>
                    <th className="pb-3 pr-4 text-right">Unit Cost</th>
                    <th className="pb-3 text-right">Total Material</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {estimate.line_items
                    .filter((item) => item.material_cost > 0)
                    .map((item) => {
                      const qty = item.quantity;
                      const matUnitCost = qty > 0 ? item.material_cost / qty : 0;
                      return (
                        <tr key={item.id} className="text-zinc-700 hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 pr-4 font-medium text-zinc-900">{item.category}</td>
                          <td className="py-3 pr-4">{item.description}</td>
                          <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                            {qty.toLocaleString()} {item.unit}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(matUnitCost)}
                          </td>
                          <td className="py-3 text-right font-semibold text-zinc-900 tabular-nums">
                            {formatCurrency(item.material_cost)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labor Table Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Labor Estimate</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Labor Description</th>
                    <th className="pb-3 pr-4 text-right">Qty</th>
                    <th className="pb-3 pr-4 text-right">Labor Rate</th>
                    <th className="pb-3 text-right">Total Labor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {estimate.line_items
                    .filter((item) => item.labor_cost > 0)
                    .map((item) => {
                      const qty = item.quantity;
                      const labUnitCost = qty > 0 ? item.labor_cost / qty : 0;
                      return (
                        <tr key={item.id} className="text-zinc-700 hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 pr-4 font-medium text-zinc-900">{item.category}</td>
                          <td className="py-3 pr-4">{item.description}</td>
                          <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                            {qty.toLocaleString()} {item.unit}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(labUnitCost)}
                          </td>
                          <td className="py-3 text-right font-semibold text-zinc-900 tabular-nums">
                            {formatCurrency(item.labor_cost)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Summary, Recommendations, Details */}
        <div className="space-y-6 lg:col-span-4">
          {/* Estimate Cost Summary Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-4">Estimate Summary</h2>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-zinc-100 pb-2 text-zinc-600">
                <span>Material Cost</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(materialCost, estimate.currency)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2 text-zinc-600">
                <span>Labor Cost</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(laborCost, estimate.currency)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2 text-zinc-600">
                <span>Equipment Cost</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(equipmentCost, estimate.currency)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2 text-zinc-600">
                <span>Miscellaneous Cost</span>
                <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(miscCost, estimate.currency)}</span>
              </div>
              <div className="flex justify-between pt-1.5 font-bold text-zinc-900 text-base">
                <span>Total Estimated Cost</span>
                <span className="tabular-nums">{formatCurrency(estimate.total_cost, estimate.currency)}</span>
              </div>
              <div className="mt-4 rounded-lg bg-orange-50/50 p-3 text-orange-800 border border-orange-100 flex justify-between items-center text-xs">
                <span className="font-medium">Estimated Duration</span>
                <span className="font-bold text-sm">
                  {((estimate.assumptions?.estimated_duration || "6 months") as string)}
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {Array.isArray(estimate.assumptions?.ai_recommendations) &&
            (estimate.assumptions.ai_recommendations as string[]).length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900 mb-3">AI Recommendations</h2>
                <ul className="space-y-3">
                  {(estimate.assumptions.ai_recommendations as string[]).map((rec, idx) => (
                    <li key={idx} className="flex gap-2.5 text-sm text-zinc-600 leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Project Details */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-3">Project Details</h2>
            <div className="space-y-3 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Client Name</span>
                <span className="font-semibold text-zinc-900">{(estimate.assumptions?.client_name as string) || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="font-semibold text-zinc-900">{(estimate.assumptions?.project_location as string) || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Building Type</span>
                <span className="font-semibold text-zinc-900 capitalize">{estimate.project.project_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross Area</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  {Number(estimate.assumptions?.gross_sqft || 0).toLocaleString()} sq ft
                </span>
              </div>
              <div className="flex justify-between">
                <span>Floors</span>
                <span className="font-semibold text-zinc-900">{estimate.assumptions?.stories || 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Construction Quality</span>
                <span className="font-semibold text-zinc-950 px-2 py-0.5 bg-zinc-100 rounded text-xs">
                  {(estimate.assumptions?.construction_quality as string) || "Standard"}
                </span>
              </div>
              {Boolean(estimate.assumptions?.notes) && (
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Notes</span>
                  <p className="text-xs leading-relaxed text-zinc-500 bg-zinc-50 p-2 rounded">
                    {(estimate.assumptions.notes as string)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard/estimates/new"
              className="flex w-full items-center justify-center rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
            >
              Generate Again
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Estimate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

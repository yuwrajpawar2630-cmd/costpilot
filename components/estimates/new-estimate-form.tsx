"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NewEstimateForm({
  allowed = true,
  used = 0,
  limit = 2,
}: {
  allowed?: boolean;
  used?: number;
  limit?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!allowed) {
      const timer = setTimeout(() => {
        router.push("/pricing");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allowed, router]);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<"Economy" | "Standard" | "Premium">("Standard");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("quality", quality);

    // Validate inputs
    const area = Number(formData.get("area"));
    const floors = Number(formData.get("floors"));
    if (isNaN(area) || area <= 0) {
      setError("Please enter a valid positive area.");
      setLoading(false);
      return;
    }
    if (isNaN(floors) || floors < 1) {
      setError("Number of floors must be at least 1.");
      setLoading(false);
      return;
    }

    try {
      const createRes = await fetch("/api/estimates/create", {
        method: "POST",
        body: formData,
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error ?? "Upload failed");
      }

      const estimateId = createData.estimate.id as string;

      const analyzeRes = await fetch(`/api/estimates/${estimateId}/analyze`, {
        method: "POST",
      });

      if (!analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        throw new Error(analyzeData.error ?? "Analysis failed to start");
      }

      router.push(`/dashboard/estimates/${estimateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Project Name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Smith Residence New Build"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Client Name
          </label>
          <input
            name="clientName"
            type="text"
            required
            placeholder="John & Mary Smith"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Project Location
          </label>
          <input
            name="projectLocation"
            type="text"
            required
            placeholder="Austin, TX, USA"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Building Type
          </label>
          <select
            name="buildingType"
            required
            defaultValue="Residential"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none bg-white"
          >
            <option value="Residential">Residential Single-Family</option>
            <option value="Multi-family">Multi-family Residential</option>
            <option value="Commercial">Light Commercial</option>
            <option value="Industrial">Industrial / Warehouse</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Area (sq ft)
          </label>
          <input
            name="area"
            type="number"
            required
            min="1"
            placeholder="2500"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700">
            Number of Floors
          </label>
          <input
            name="floors"
            type="number"
            required
            min="1"
            placeholder="2"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">
          Construction Quality
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["Economy", "Standard", "Premium"] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                quality === q
                  ? "border-orange-500 bg-orange-50/50 text-orange-700 ring-2 ring-orange-500/20"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <span className="text-sm font-bold">{q}</span>
              <span className="mt-0.5 text-xs text-zinc-500">
                {q === "Economy" && "Basic finishes & materials"}
                {q === "Standard" && "Standard builder grade"}
                {q === "Premium" && "High-end custom finishes"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-zinc-700">
          Notes / Special Instructions (Optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="e.g., Include detached garage, high-pitched metal roof, or specific slab thickness..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-zinc-700">
          Blueprint Upload
        </label>
        <input
          name="file"
          type="file"
          accept="application/pdf, image/png, image/jpeg"
          required
          className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-orange-700 file:hover:bg-orange-100 transition-colors"
        />
        <p className="mt-1.5 text-xs text-zinc-500">PDF, PNG, or JPG/JPEG (Max 25MB)</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!allowed && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 font-medium">
          Upgrade Plan: You have reached your limit of {limit} free blueprint analyses. Redirecting you to the billing page to upgrade...
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !allowed}
        className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Uploading & Analyzing Blueprint...
          </span>
        ) : (
          "Analyze Blueprint"
        )}
      </button>
    </form>
  );
}

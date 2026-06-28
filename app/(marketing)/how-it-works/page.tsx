import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      n: "1",
      title: "Upload your blueprint",
      desc: "Drop a PDF floor plan. Add project name, city, and state for regional pricing.",
    },
    {
      n: "2",
      title: "AI reads your plans",
      desc: "Our AI extracts building scope — square footage, stories, trades — and maps quantities to cost data.",
    },
    {
      n: "3",
      title: "Get your draft estimate",
      desc: "Review 8 cost categories with material and labor breakdown. Export a professional PDF report.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">How CostPilot AI works</h1>
      <p className="mt-3 text-zinc-600">
        Three steps. Under 10 minutes. No takeoff training required.
      </p>
      <div className="mt-12 space-y-8">
        {steps.map((step) => (
          <div key={step.n} className="flex gap-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
              {step.n}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="mt-1 text-zinc-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/signup"
        className="mt-12 inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white hover:bg-orange-700"
      >
        Try it free
      </Link>
    </div>
  );
}

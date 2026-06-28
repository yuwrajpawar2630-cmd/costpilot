import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-orange-50 to-white px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
            AI construction estimating
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            {APP_TAGLINE}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            Upload a blueprint PDF. {APP_NAME} analyzes your plans and generates
            a professional draft estimate — materials, labor, and total project
            cost. Not project management. Just estimating.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white hover:bg-orange-700"
            >
              Try free — 2 estimates/month
            </Link>
            <Link
              href="/sample-report"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium hover:bg-zinc-50"
            >
              View sample report
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold">Built for contractors</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Residential GCs",
              desc: "Bid faster on single-family and townhouse projects without enterprise software.",
            },
            {
              title: "Independent estimators",
              desc: "Turn PDF plans into categorized cost breakdowns your clients can review.",
            },
            {
              title: "Small builders",
              desc: "Get a credible ROM number in minutes — not hours in Excel.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">8 cost categories, one report</h2>
          <p className="mt-4 text-zinc-600">
            Foundation · Concrete · Steel · Roofing · Plumbing · Electrical ·
            Finishing · General — with material and labor split.
          </p>
          <Link
            href="/how-it-works"
            className="mt-6 inline-block text-sm font-medium text-orange-600 hover:underline"
          >
            See how it works →
          </Link>
        </div>
      </section>
    </>
  );
}

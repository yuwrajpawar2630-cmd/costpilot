import type { Metadata } from "next";

export function getMetadata({
  title,
  description,
  path,
  keywords = [
    "construction estimating",
    "AI estimating",
    "construction cost estimator",
    "blueprint takeoff",
    "construction bid",
    "material takeoff",
    "labor estimation",
    "contractor tool",
  ],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `https://costpilotsai.com${path}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "CostPilot AI",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "https://costpilotsai.com/og-image.png",
          width: 1200,
          height: 630,
          alt: "CostPilot AI — AI Construction Cost Estimating",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://costpilotsai.com/og-image.png"],
    },
  };
}

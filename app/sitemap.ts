import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://costpilotsai.com";
  const now = new Date();

  const paths = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/how-it-works", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/sample-report", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/signup", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/forgot-password", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/beta", changeFrequency: "weekly" as const, priority: 0.5 },
  ];

  return paths.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}

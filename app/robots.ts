import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/estimates/",
        "/profile/",
        "/settings/",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: "https://costpilotsai.com/sitemap.xml",
  };
}

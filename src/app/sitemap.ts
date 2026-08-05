import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const today = new Date();
  return [
    { url: `${base}/`, lastModified: today, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/upgrade`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
  ];
}

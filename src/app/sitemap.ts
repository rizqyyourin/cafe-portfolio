import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/menu", "/about", "/gallery", "/reservation", "/contact", "/privacy"].map((path) => ({
    url: new URL(path || "/", siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}

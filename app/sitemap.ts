import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/** Lists only the indexable homepage, without speculative modification dates. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getSiteUrl().href }];
}

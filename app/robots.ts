import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/** Allows crawlers to read route-level noindex tags and discover the public sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).href,
  };
}

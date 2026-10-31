/**
 * Returns the configured canonical origin for metadata, structured data and crawlers.
 * SITE_URL takes precedence over Vercel's stable VERCEL_PROJECT_PRODUCTION_URL;
 * deployment-specific VERCEL_URL is deliberately never used. Development falls
 * back to http://localhost:3000. Configure this before a production build.
 *
 * @throws If production has no canonical URL, or the configured URL is not an
 * HTTP(S) origin. Production additionally requires HTTPS and a non-local host.
 */
export function getSiteUrl(): URL {
  const configuredUrl = process.env.SITE_URL?.trim();
  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";
  const value =
    configuredUrl ||
    (productionDomain ? `https://${productionDomain}` : undefined);

  if (!value && isProduction) {
    throw new Error(
      "Set SITE_URL to the public HTTPS site origin before building for production (or provide VERCEL_PROJECT_PRODUCTION_URL on Vercel).",
    );
  }

  const url = new URL(value || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.",
    );
  }

  const hostname = url.hostname.toLowerCase();
  const isLocalhost =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.");
  if (isProduction && (url.protocol !== "https:" || isLocalhost)) {
    throw new Error(
      "The production SITE_URL must use HTTPS and a non-local hostname.",
    );
  }

  return url;
}

/**
 * Serializes JSON-LD for an inline script, escaping `<` so data cannot close it.
 * @param value - JSON-serializable structured data.
 * @throws If the value cannot be serialized as JSON.
 */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("JSON-LD must be a JSON-serializable value.");
  }
  return serialized.replace(/</g, "\\u003c");
}

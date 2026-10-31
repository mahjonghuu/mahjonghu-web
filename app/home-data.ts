import "server-only";

import { cookies } from "next/headers";
import { loadHomeDiscovery } from "./home-discovery";
import type { HomeData } from "./home-types";

/** Loads uncached discovery beneath Suspense, forwarding only the customer cookie. */
export async function loadHomeData(): Promise<HomeData> {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get("customerToken");
  return loadHomeDiscovery({
    cache: "no-store",
    credentials: "omit",
    headers: customerToken
      ? { Cookie: `customerToken=${encodeURIComponent(customerToken.value)}` }
      : undefined,
  });
}

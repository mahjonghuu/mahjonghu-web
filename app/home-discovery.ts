import { apiRequest } from "../lib/api";
import type { HomeData, HomeOutletRecord, HomeTable } from "./home-types";

/**
 * Loads discovery records with separate venue and table errors.
 * The caller supplies server cookie forwarding or browser credentials.
 */
export async function loadHomeDiscovery(
  init: RequestInit = {},
): Promise<HomeData> {
  const [outletResult, tableResult] = await Promise.allSettled([
    apiRequest<HomeOutletRecord[]>("/outlets/public", init),
    apiRequest<HomeTable[]>("/tables/public", init),
  ]);
  const records =
    outletResult.status === "fulfilled" && Array.isArray(outletResult.value)
      ? outletResult.value
      : null;
  const tables =
    tableResult.status === "fulfilled" && Array.isArray(tableResult.value)
      ? tableResult.value
      : null;
  const tablesByOutlet = new Map<string, HomeTable[]>();
  for (const table of tables ?? []) {
    const outletTables = tablesByOutlet.get(table.outletId);
    if (outletTables) outletTables.push(table);
    else tablesByOutlet.set(table.outletId, [table]);
  }

  return {
    outlets: (records ?? []).map((record) => ({
      ...record,
      tables: tablesByOutlet.get(record.id) ?? [],
    })),
    outletError: records
      ? null
      : "Venues could not be loaded. Please try again later.",
    tableError: tables
      ? null
      : "Tables could not be loaded. Venue information is still available, but booking is temporarily unavailable. Please try again later.",
  };
}

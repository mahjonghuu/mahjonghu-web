import type { OutletApiRecord } from "../lib/outlet";
import type { TableApiRecord } from "../lib/table";

/** Public-discovery outlet fields, including customer-granted private venues. */
export type HomeOutletRecord = Omit<
  OutletApiRecord,
  "id" | "occupiedTableCount"
> & { id: string };

/** Table identity required by the public booking schedule. */
export type HomeTable = Pick<TableApiRecord, "id" | "outletId" | "name">;

/** Discoverable outlet and its loaded booking tables. */
export type HomeOutlet = HomeOutletRecord & { tables: HomeTable[] };

/** Server-loaded homepage data with separate discovery and table failures. */
export type HomeData = {
  outlets: HomeOutlet[];
  outletError: string | null;
  tableError: string | null;
};

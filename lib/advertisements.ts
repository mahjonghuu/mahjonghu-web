import { apiRequest } from "./api";

/** Scheduled advertisement returned by the owner and public endpoints. */
export type AdvertisementRecord = {
  id: string;
  title: string;
  imageUrl: string;
  /** Inclusive calendar date in Asia/Jakarta, formatted as YYYY-MM-DD. */
  startsOn: string;
  /** Inclusive calendar date in Asia/Jakarta, formatted as YYYY-MM-DD. */
  endsOn: string;
  /** Derived by the server using its current Jakarta calendar date. */
  status: "scheduled" | "active" | "expired";
};

/** Required fields for a new advertisement; image is a compressed data URL. */
export type AdvertisementInput = {
  title: string;
  image: string;
  startsOn: string;
  endsOn: string;
};

/** Editable fields; omitting image preserves the saved Storage image. */
export type AdvertisementUpdateInput = Partial<AdvertisementInput>;

/** Advertisement operations shared by the owner dashboard and homepage popup. */
export const advertisementApi = {
  /** Lists all owner advertisements, newest first. */
  async list(): Promise<AdvertisementRecord[]> {
    const records = await apiRequest<AdvertisementRecord[]>("/advertisements", {
      cache: "no-store",
    });
    if (!Array.isArray(records)) {
      throw new Error("Invalid advertisement list response.");
    }
    return records;
  },

  /** Lists only advertisements active today in Jakarta, without requiring login. */
  async publicList(): Promise<AdvertisementRecord[]> {
    const records = await apiRequest<AdvertisementRecord[]>(
      "/advertisements/public",
      { cache: "no-store" },
    );
    if (!Array.isArray(records)) {
      throw new Error("Invalid advertisement list response.");
    }
    return records;
  },

  /** Creates an advertisement with a required compressed image. */
  create(input: AdvertisementInput): Promise<AdvertisementRecord> {
    return apiRequest<AdvertisementRecord>("/advertisements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Updates supplied fields only; existing image URLs are never upload inputs. */
  update(
    id: string,
    input: AdvertisementUpdateInput,
  ): Promise<AdvertisementRecord> {
    return apiRequest<AdvertisementRecord>(
      `/advertisements/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
  },

  /** Permanently deletes an advertisement. */
  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/advertisements/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

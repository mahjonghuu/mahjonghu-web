const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

type ApiErrorBody = { message?: string | string[] } | null;

/** HTTP error returned by the backend API. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Sends a request to the configured backend and parses its JSON response. */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(", ")
      : (errorBody?.message ?? `Permintaan gagal (${response.status}).`);
    throw new ApiError(message, response.status);
  }
  return body as T;
}

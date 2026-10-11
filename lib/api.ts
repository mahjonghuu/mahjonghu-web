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
  const method = (init?.method ?? "GET").toUpperCase();
  const requestId = crypto.randomUUID();
  const requestContext = { requestId, method, path };
  const requestHeaders = new Headers(init?.headers);
  requestHeaders.set("X-Request-ID", requestId);
  const startedAt = performance.now();
  console.info("[api] request started", requestContext);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: init?.credentials ?? "include",
      headers: requestHeaders,
    });
    const body =
      response.status === 204 ? null : await response.json().catch(() => null);
    const durationMs = Math.round(performance.now() - startedAt);
    if (!response.ok) {
      console.warn("[api] request failed", {
        ...requestContext,
        status: response.status,
        durationMs,
      });
      const errorBody = body as ApiErrorBody;
      const message = Array.isArray(errorBody?.message)
        ? errorBody.message.join(", ")
        : (errorBody?.message ?? `Permintaan gagal (${response.status}).`);
      throw new ApiError(message, response.status);
    }
    console.info("[api] request completed", {
      ...requestContext,
      status: response.status,
      durationMs,
    });
    return body as T;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      console.error("[api] request failed", {
        ...requestContext,
        durationMs: Math.round(performance.now() - startedAt),
        failure: error instanceof Error ? error.name : "UnknownError",
      });
    }
    throw error;
  }
}

// Server-only helpers for calling the FastAPI backend.
// Do not import this from a "use client" file — it's meant for
// Route Handlers, Server Components, and Server Actions only.

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "https://mypcp.us/v/1/KanopiDealer";
export const CONTRACT_API_URL = "https://mypcp.us/webservices/";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the FastAPI backend and normalizes both response shapes it can return:
 *  - success envelope: { success, detail, data, total? } → unwraps to `data`
 *  - error envelope: raised HTTPException → { detail } → thrown as ApiError
 *  - a few endpoints (e.g. /user/me) return a raw body with no envelope —
 *    those pass through unchanged since there's no `.data` key to unwrap.
 */
export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = BACKEND_API_URL,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, init);
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.detail ?? payload?.message ?? "Request failed",
    );
  }

  return (
    payload && typeof payload === "object" && "data" in payload
      ? payload.data
      : payload
  ) as T;
}

// The backend's standard response shape (api_response in core/response.py).
export interface ApiEnvelope<T = unknown> {
  success?: number;
  detail?: string;
  data?: T;
  total?: number;
}

/**
 * Calls the backend and returns its FULL { success, detail, data, total }
 * envelope plus the HTTP status — for Route Handlers that forward the result
 * straight to the client (whose `fetching()` reads .detail and .data).
 *
 * Unlike backendFetch, this does NOT unwrap to `.data` and does NOT throw on
 * an error status — the route forwards `detail` + `status` as-is (so the
 * backend's own "Category Created Successfully" / validation messages reach
 * the UI). Raw non-enveloped bodies (e.g. /user/me) are wrapped as { data }.
 * Only a network/parse failure rejects, which the route's try/catch handles.
 */
export async function backendEnvelope<T = unknown>(
  path: string,
  init?: RequestInit,
  baseUrl: string = BACKEND_API_URL,
): Promise<{ status: number; envelope: ApiEnvelope<T> }> {
  const res = await fetch(`${baseUrl}${path}`, init);
  const payload = await res.json().catch(() => null);
  const isEnveloped =
    payload !== null &&
    typeof payload === "object" &&
    ("data" in payload || "detail" in payload || "success" in payload);
  const envelope: ApiEnvelope<T> = isEnveloped
    ? (payload as ApiEnvelope<T>)
    : { data: (payload ?? undefined) as T | undefined };
  return { status: res.status, envelope };
}

export async function authorizedEnvelope<T = unknown>(
  path: string,
  token: string,
  init: RequestInit = {},
  baseUrl: string = BACKEND_API_URL,
): Promise<{ status: number; envelope: ApiEnvelope<T> }> {
  return backendEnvelope<T>(
    path,
    {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    },
    baseUrl,
  );
}

export async function authorizedFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
  baseUrl: string = BACKEND_API_URL,
): Promise<T> {
  return backendFetch<T>(
    path,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    },
    baseUrl,
  );
}

/**
 * Like authorizedFetch, but for listRecords()-style endpoints whose envelope
 * is { success, detail, data, total } — backendFetch's unwrap keeps only
 * `data` and drops `total`, which paginated tables need too.
 */
export async function authorizedFetchList<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<{ data: T[]; total: number }> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.detail ?? payload?.message ?? "Request failed",
    );
  }

  return { data: payload?.data ?? [], total: payload?.total ?? 0 };
}

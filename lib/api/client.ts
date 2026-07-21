// Client-side helpers for talking to the same-origin Next API routes
// (app/api/**). Auth is a httpOnly cookie the browser sends automatically,
// so nothing here attaches a token — the route handlers forward it.
//
// Client-only, like the loader it drives — there's no server-side
// equivalent of showing a spinner, since a Route Handler has no live UI to
// show one in. Use lib/api/server.ts (backendFetch/backendEnvelope) there.
import { setBadgeLoading, setGlobalLoading } from "@/app/providers/LoaderContext";

/** FormData → plain object (files pass through as File). */
export const formDataToObject = (
  formData: FormData,
): Record<string, FormDataEntryValue> => {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
};

/**
 * Object → FormData. Skips undefined/null/"" so optional fields are simply
 * omitted (FastAPI's `Optional[int] = Form(None)` 422s on an empty string —
 * omitting is what it actually wants). Booleans/numbers are stringified;
 * File/Blob pass through untouched.
 */
export const objectToFormData = (
  obj: Record<string, unknown>,
  formData: FormData = new FormData(),
): FormData => {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === null || value === "") continue;
    if (value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }
  return formData;
};

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  /** Convenience alias for the backend envelope's `data` (the T you asked for). */
  message?: T;
  data?: T;
  /** The backend envelope's `detail` text (success or error message). */
  detail?: string;
  /** The backend envelope's `success` flag (1 / 0). */
  success?: 1 | 0 | number;
  /**
   * Any other field the backend returned (e.g. `data`, `total`, or a raw
   * non-enveloped body). Access it as `res.<field>` — typed `unknown`, so
   * cast/narrow at the call site.
   */
  [key: string]: unknown;
}

export interface FetchParams {
  /** Same-origin route path, e.g. "/api/category" or "/api/category/5". */
  url: string;
  method?: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Request body. Pass a plain object and `fetching` decides how to send it:
   *  - `isFormdata: true`  → converted to multipart FormData internally
   *    (via objectToFormData — undefined/null/"" omitted, File/Blob kept),
   *    so callers never build FormData by hand. Use for FastAPI `Form(...)`
   *    endpoints and any request with a file.
   *  - otherwise           → sent as JSON.
   * A pre-built FormData is also accepted and sent as-is.
   */
  body?: FormData | Record<string, unknown>;
  /** Send `body` as multipart FormData instead of JSON. */
  isFormdata?: boolean;
  /**
   * Custom show/hide callback (e.g. a component-local spinner). Omit it and
   * `fetching` drives the shared global loader for you automatically — no
   * useLoader()/useContext needed at the call site.
   */
  setLoading?: (loading: boolean) => void;
  /**
   * Show a named "Loading X…" badge (instead of the plain full-screen
   * spinner) for the duration of this call, e.g. `badgeLoading: "models"`.
   * Ignored if `setLoading` is also passed.
   */
  badgeLoading?: string;
  /** Set to false to show no loader at all for this call (e.g. silent polling). */
  showLoader?: boolean;
}

/**
 * Thin fetch wrapper covering the common case: hit a Next API route, parse
 * the JSON envelope, and normalize success/error into one ApiResult shape so
 * callers stop re-writing `if (!res.ok) { const { detail } = await res.json() }`
 * — and stop hand-converting objects to FormData (pass `isFormdata: true`).
 *
 * Also drives the global loader by default (see LoaderContext's hook-free
 * singleton) — pass `setLoading` only when you need a component-local
 * spinner instead, `badgeLoading: "label"` for a named badge, or
 * `showLoader: false` to skip it entirely.
 */
export async function fetching<T = unknown>({
  url,
  method = "POST",
  body,
  isFormdata,
  setLoading,
  badgeLoading,
  showLoader = true,
}: FetchParams): Promise<ApiResult<T>> {
  const startLoading = () => {
    if (setLoading) return setLoading(true);
    if (!showLoader) return;
    if (badgeLoading) return setBadgeLoading(badgeLoading, true);
    setGlobalLoading(true);
  };
  const stopLoading = () => {
    if (setLoading) return setLoading(false);
    if (!showLoader) return;
    if (badgeLoading) return setBadgeLoading(badgeLoading, false);
    setGlobalLoading(false);
  };

  startLoading();
  try {
    // Resolve URL + body + headers. Only JSON needs an explicit Content-Type —
    // for FormData the browser sets the multipart boundary itself.
    let requestUrl = url;
    let requestBody: BodyInit | undefined;
    let headers: HeadersInit | undefined;

    // GET/HEAD requests CANNOT carry a body — fetch() throws if you try. Send
    // the params as a query string instead (skipping undefined/null/"").
    if (method === "GET" || method === "HEAD") {
      if (body && !(body instanceof FormData)) {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          if (value === undefined || value === null || value === "") continue;
          qs.append(key, String(value));
        }
        const query = qs.toString();
        if (query) requestUrl += (url.includes("?") ? "&" : "?") + query;
      }
    } else if (body instanceof FormData) {
      requestBody = body;
    } else if (body && isFormdata) {
      requestBody = objectToFormData(body);
    } else if (body) {
      requestBody = JSON.stringify(body);
      headers = { "Content-Type": "application/json" };
    }

    const res = await fetch(requestUrl, { method, headers, body: requestBody });

    // NOTE: the body stream can only be read once — parse it exactly here.
    // Keep the body loose (any shape the backend returns), spread it through so
    // every field is reachable as `res.<field>`, then normalise the common
    // envelope keys. `message` aliases `data` (or a raw `message` if that's
    // what came back).
    const payload = (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    return {
      ...(payload ?? {}),
      ok: res.ok,
      status: res.status,
      message: (payload?.data ?? payload?.message) as T | undefined,
      detail: payload?.detail as string | undefined,
      success: payload?.success as 1 | 0 | number | undefined,
    };
  } catch {
    return { ok: false, status: 0, success: 0 };
  } finally {
    stopLoading();
  }
}

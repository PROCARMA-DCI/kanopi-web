// Client-side helpers for talking to the same-origin Next API routes
// (app/api/**). Auth is a httpOnly cookie the browser sends automatically,
// so nothing here attaches a token — the route handlers forward it.

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
  /** The backend envelope's `data` payload (this is the T you asked for). */
  message?: T;

  /** The backend envelope's `success` flag (1 / 0). */
  success?: 1 | 0 | number;
}

export interface FetchParams {
  /** Same-origin route path, e.g. "/api/category" or "/api/category/5". */
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
  setLoading?: (loading: boolean) => void;
}

/**
 * Thin fetch wrapper covering the common case: hit a Next API route, parse
 * the JSON envelope, and normalize success/error into one ApiResult shape so
 * callers stop re-writing `if (!res.ok) { const { detail } = await res.json() }`
 * — and stop hand-converting objects to FormData (pass `isFormdata: true`).
 */
export async function fetching<T = unknown>({
  url,
  method = "POST",
  body,
  isFormdata,
  setLoading,
}: FetchParams): Promise<ApiResult<T>> {
  setLoading?.(true);
  try {
    // Resolve body + headers. Only JSON needs an explicit Content-Type — for
    // FormData the browser sets the multipart boundary itself.
    let requestBody: BodyInit | undefined;
    let headers: HeadersInit | undefined;

    if (body instanceof FormData) {
      requestBody = body;
    } else if (body && isFormdata) {
      requestBody = objectToFormData(body);
    } else if (body) {
      requestBody = JSON.stringify(body);
      headers = { "Content-Type": "application/json" };
    }

    const res = await fetch(url, { method, headers, body: requestBody });

    // NOTE: the body stream can only be read once — parse it exactly here.
    // The route forwards the backend envelope { success, detail, data } — so
    // the payload we want lives in `data`, which we expose as `message`.
    const payload = (await res.json().catch(() => null)) as {
      message?: T;
      success?: 1 | 0 | number;
    } | null;

    return {
      ok: res.ok,
      status: res.status,
      ...payload,
    };
  } catch {
    return { ok: false, status: 0, success: 0 };
  } finally {
    setLoading?.(false);
  }
}

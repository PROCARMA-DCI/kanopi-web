import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAccessToken } from "@/app/auth/session";
import {
  BACKEND_API_URL,
  backendEnvelope,
  CONTRACT_API_URL,
} from "@/lib/api/server";

/**
 * Generic pass-through proxy: /api/<slug> → FastAPI's /<slug>, same method,
 * same body, same query string. The slug IS the real backend path — e.g.
 * `/api/category/create` calls backend `/category/create`,
 * `/api/contract/update/5` calls backend `/contract/update/5`.
 *
 * Why this exists instead of one route.ts file per resource: every one of
 * those files was doing the exact same thing (attach token if present,
 * forward body, wrap the { success, status, message } envelope). The backend
 * is already the source of truth for what routes exist — we don't need to
 * re-declare that shape on the frontend too.
 *
 * A more specific file (e.g. app/api/contract/[id]/route.ts) always wins over
 * this catch-all for the same path — that's plain Next.js routing, verified
 * live, not something this file has to account for. So if one resource ever
 * needs custom behavior (extra query defaults, setting a cookie, etc.), just
 * add its own route.ts next to this one and it takes over automatically.
 *
 * RESOURCE_BACKENDS is a per-resource OVERRIDE table: everything proxies to
 * BACKEND_API_URL by default, so you only add an entry when a resource lives
 * on a DIFFERENT backend server (point it at that server's env var). Auth is
 * still enforced by each backend per-endpoint (this just attaches the token
 * when one exists).
 */
const RESOURCE_BACKENDS: Record<string, string> = {
  // Example — a resource served by a DIFFERENT backend:
  contracts: CONTRACT_API_URL,
};

async function proxy(request: NextRequest, slugParts: string[]) {
  const [resource, ...rest] = slugParts;
  // Different server if listed, otherwise the default backend.
  const baseUrl = RESOURCE_BACKENDS[resource] ?? BACKEND_API_URL;

  const backendPath = `/${resource}${rest.length ? `/${rest.join("/")}` : ""}${request.nextUrl.search}`;

  // currently token not use in this project
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = !["GET", "HEAD"].includes(request.method);
  if (hasBody) {
    // Forward the exact bytes + content-type (multipart boundary and all) —
    // this works for both JSON and file-uploading forms without needing to
    // know which one it is.
    const contentType = request.headers.get("content-type");
    if (contentType) headers["content-type"] = contentType;
  }

  try {
    const { status, envelope } = await backendEnvelope(
      backendPath,
      {
        method: request.method,
        headers,
        body: hasBody ? await request.blob() : undefined,
      },
      baseUrl,
    );
    return NextResponse.json(envelope, { status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach backend" },
      { status: 502 },
    );
  }
}

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).slug);
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).slug);
}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).slug);
}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).slug);
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxy(request, (await params).slug);
}

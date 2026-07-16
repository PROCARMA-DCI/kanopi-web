import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { authorizedFetch } from "@/lib/api/server";

const ACCESS_TOKEN_COOKIE = "access_token";
type AuthUser = Record<string, unknown>;

// Server-only. Do not import from a "use client" file —
// next/headers throws at build time if you try.
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Resolves the signed-in user (with roles) for the current request, or null.
 * Wrapped in React's cache() so multiple layouts/pages calling this in the
 * same request share one /user/me round trip instead of duplicating it.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    return await authorizedFetch<AuthUser>("/user/read", token, {
      cache: "no-store",
    });
  } catch {
    return null;
  }
});

/**
 * Resolves the signed-in user for a page/layout that requires auth, or
 * redirects to /signin. Use this instead of a bare `getCurrentUser()` + `if`
 * in any route that must always be protected; for a route that should be
 * reachable by both guests and signed-in users, call `getCurrentUser()`
 * directly and branch on the result instead.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

/** Decodes a JWT's `exp` claim without verifying its signature — used only
 *  to size the cookie's max-age, never to trust the token's contents. */
export function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

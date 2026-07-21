"use client";

import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Spinner } from "@/components/ui/spinner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface LoaderContextValue {
  /** True while at least one thing is loading. */
  loading: boolean;
  /** Increment the loading counter (one more in-flight task). */
  show: () => void;
  /** Decrement the loading counter. */
  hide: () => void;
  /**
   * Bridge for `fetching({ setLoading })` — pass this straight in and the
   * global (unnamed, full-screen) overlay shows for the duration of the
   * request:
   *   const { setLoading } = useLoader();
   *   await fetching({ url, setLoading });
   */
  setLoading: (value: boolean) => void;
  /**
   * NAMED loading, for when you want to show a small "Loading models…"
   * badge next to one specific field instead of the full-screen overlay.
   * Each `key` is independent, so any number of named loads can overlap:
   *   badgeLoading("models", true);
   *   await fetching(...);
   *   badgeLoading("models", false);
   */
  badgeLoading: (key: string, value: boolean) => void;
  /** Is this specific named key currently loading? Drives inline UI. */
  isBadgeLoading: (key: string) => boolean;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export const useLoader = (): LoaderContextValue => {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used inside a <LoaderProvider>");
  return ctx;
};

// ── Hook-free singleton bridge ───────────────────────────────────────────
// `fetching()` (lib/api/client.ts) is a plain function, not a component, so
// it can't call useLoader(). <LoaderProvider> wires these module-level
// functions to its real state on mount, so ANY client code — fetching(), a
// plain event handler, whatever — can drive the same global loader without
// importing useContext.
//
// Client-only: it bridges to a mounted <LoaderProvider> in the DOM. Calling
// it from a Server Component / Route Handler is a no-op — that code runs in
// a separate request context with no live UI to show a spinner in.
let showFn: (value: boolean) => void = () => {};
let badgeFn: (key: string, value: boolean) => void = () => {};

/** Show/hide the global full-screen loader from anywhere — no hook needed. */
export const setGlobalLoading = (value: boolean) => showFn(value);
/** Show/hide a named "Loading X…" badge from anywhere — no hook needed. */
export const setBadgeLoading = (key: string, value: boolean) =>
  badgeFn(key, value);

/**
 * App-wide loading overlay. A COUNTER (not a boolean) so overlapping requests
 * don't hide the loader early — it stays until every in-flight call finishes.
 */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  // Named loads currently in flight, e.g. { "Loading models": true }. A map
  // (not a single string) so unrelated named loads never clobber each other.
  const [badges, setBadges] = useState<Record<string, boolean>>({});

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const setLoading = useCallback(
    (value: boolean) => (value ? show() : hide()),
    [show, hide],
  );

  const badgeLoading = useCallback((key: string, value: boolean) => {
    setBadges((prev) => {
      if (value) return { ...prev, [key]: true };
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const isBadgeLoading = useCallback(
    (key: string) => Boolean(badges[key]),
    [badges],
  );

  // Point the module-level singleton at this provider's real state, so
  // setGlobalLoading()/setBadgeLoading() reach the same overlay as
  // setLoading()/badgeLoading() via useLoader().
  useEffect(() => {
    showFn = setLoading;
    badgeFn = badgeLoading;
    return () => {
      showFn = () => {};
      badgeFn = () => {};
    };
  }, [setLoading, badgeLoading]);

  const activeBadgeKeys = useMemo(() => Object.keys(badges), [badges]);
  const loading = count > 0 || activeBadgeKeys.length > 0;

  const value = useMemo<LoaderContextValue>(
    () => ({ loading, show, hide, setLoading, badgeLoading, isBadgeLoading }),
    [loading, show, hide, setLoading, badgeLoading, isBadgeLoading],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {loading && <GlobalLoader label={activeBadgeKeys[0]} />}
    </LoaderContext.Provider>
  );
}

function GlobalLoader({ label }: { label?: string }) {
  return (
    <div
      role="alert"
      aria-busy="true"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
    >
      {label ? (
        <div className="flex items-center gap-4 p-2 [--radius:1.2rem]">
          <Badge variant="secondary">
            <Spinner data-icon="inline-start" />
            {label}...
          </Badge>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-transparent px-8 py-6 ">
          <Loader size={36} />
        </div>
      )}
    </div>
  );
}

export default LoaderProvider;

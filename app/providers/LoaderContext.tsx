"use client";

import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Spinner } from "@/components/ui/spinner";
import {
  createContext,
  useCallback,
  useContext,
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
   *   batchLoading("models", true);
   *   await fetching(...);
   *   batchLoading("models", false);
   */
  batchLoading: (key: string, value: boolean) => void;
  /** Is this specific named key currently loading? Drives inline UI. */
  isBatchLoading: (key: string) => boolean;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export const useLoader = (): LoaderContextValue => {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used inside a <LoaderProvider>");
  return ctx;
};

/**
 * App-wide loading overlay. A COUNTER (not a boolean) so overlapping requests
 * don't hide the loader early — it stays until every in-flight call finishes.
 */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  // Named loads currently in flight, e.g. { "Loading models": true }. A map
  // (not a single string) so unrelated named loads never clobber each other.
  const [batches, setBatches] = useState<Record<string, boolean>>({});

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const setLoading = useCallback(
    (value: boolean) => (value ? show() : hide()),
    [show, hide],
  );

  const batchLoading = useCallback((key: string, value: boolean) => {
    setBatches((prev) => {
      if (value) return { ...prev, [key]: true };
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const isBatchLoading = useCallback(
    (key: string) => Boolean(batches[key]),
    [batches],
  );

  const activeBatchKeys = useMemo(() => Object.keys(batches), [batches]);
  const loading = count > 0 || activeBatchKeys.length > 0;

  const value = useMemo<LoaderContextValue>(
    () => ({ loading, show, hide, setLoading, batchLoading, isBatchLoading }),
    [loading, show, hide, setLoading, batchLoading, isBatchLoading],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {loading && <GlobalLoader label={activeBatchKeys[0]} />}
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
        <div className="flex p-2 items-center gap-4 [--radius:1.2rem]">
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

"use client";

import { Loader } from "@/components/ui/loader";
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
   * global overlay shows for the duration of the request:
   *   const { setLoading } = useLoader();
   *   await fetching({ url, setLoading });
   */
  setLoading: (value: boolean) => void;
  batchLoading?: (value: string) => void;
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

  const show = useCallback(() => setCount((c) => c + 1), []);
  const hide = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);
  const setLoading = useCallback(
    (value: boolean) => (value ? show() : hide()),
    [show, hide],
  );
  const batchLoading = useCallback(
    (value: string) => (value ? show() : hide()),
    [show, hide],
  );

  const loading = count > 0;
  const value = useMemo<LoaderContextValue>(
    () => ({ loading, show, hide, setLoading, batchLoading }),
    [loading, show, hide, setLoading, batchLoading],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {loading && <GlobalLoader />}
    </LoaderContext.Provider>
  );
}

function GlobalLoader() {
  return (
    <div
      role="alert"
      aria-busy="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-transparent px-8 py-6 ">
        <Loader size={36} />
      </div>
    </div>
  );
}

export default LoaderProvider;

"use client";

import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

// Register the ScrollToPlugin once, here, so every component that uses the
// provider can rely on `gsap.to(window, { scrollTo })` working.
gsap.registerPlugin(ScrollToPlugin);

/** Optional tuning for a single scroll call. */
export interface ScrollToOptions {
  /** Animation length in seconds (default 1). */
  duration?: number;
  /** Pixels to leave above the target — useful if you add a sticky header. */
  offsetY?: number;
  /** GSAP ease (default "power2.inOut"). */
  ease?: string;
}

interface ScrollContextValue {
  /** Smoothly scroll a DOM element (by id) into view. */
  scrollTo: (id: string, options?: ScrollToOptions) => void;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

/**
 * App-wide smooth-scroll provider.
 *
 * Wrap the tree once (see app/layout.tsx) and then, from ANY client component:
 *
 *   const { scrollTo } = useScroll();
 *   scrollTo("check-rates");            // jump to <div id="check-rates">
 *   scrollTo("industry", { offsetY: 80 });
 *
 * Centralising the scroll logic here means every section animates the same
 * way and we register the GSAP plugin in exactly one place.
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const scrollTo = useCallback((id: string, options: ScrollToOptions = {}) => {
    const { duration = 1, offsetY = 0, ease = "power2.inOut" } = options;

    // Wait two animation frames so a *freshly mounted* target (e.g. a wizard
    // screen that was just revealed) is in the DOM and laid out before we
    // measure and scroll to it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        gsap.to(window, {
          duration,
          ease,
          // autoKill:false → the target's own entrance animation won't abort
          // the scroll. overwrite:true → cancel any scroll already running.
          scrollTo: { y: el, offsetY, autoKill: false },
          overwrite: true,
        });
      });
    });
  }, []);

  const value = useMemo<ScrollContextValue>(() => ({ scrollTo }), [scrollTo]);

  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  );
}

/** Access the shared scrollTo(). Throws if used outside <ScrollProvider>. */
export function useScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error("useScroll must be used inside a <ScrollProvider>");
  }
  return ctx;
}

export { ScrollContext };
export default ScrollProvider;

"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Fires `onRevisit` once on mount, and again every time this element
 * becomes ≥50% visible after having dropped below that threshold — for
 * screens that live in a snap-scroll flow and never unmount/remount once
 * revealed (like every YesAccountFlow screen now: NoAccountFlow's own
 * `flow.stepId`/scrollTo pattern). A plain mount-only effect would only
 * ever run once for a screen like that; this is what makes "call the API
 * again every time we scroll back to this screen" actually work.
 *
 * Same coverage-ratio math as useHeaderDominance/ScreenShell's own blur
 * effect — just triggering a callback instead of an opacity change.
 */
export function useRevisit(
  rootRef: RefObject<HTMLElement | null>,
  onRevisit: () => void,
) {
  // Keep the latest callback without re-running the effect (and re-adding
  // scroll listeners) every time the caller passes a fresh function.
  const onRevisitRef = useRef(onRevisit);
  onRevisitRef.current = onRevisit;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let wasDominant = false;
    let raf = 0;

    const check = () => {
      raf = 0;
      const viewportPx = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const visiblePx = Math.max(
        0,
        Math.min(rect.bottom, viewportPx) - Math.max(rect.top, 0),
      );
      const coverage = viewportPx > 0 ? visiblePx / viewportPx : 0;
      const dominant = coverage >= 0.5;
      if (dominant && !wasDominant) onRevisitRef.current();
      wasDominant = dominant;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check(); // mounting while already in view counts as the first visit
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}

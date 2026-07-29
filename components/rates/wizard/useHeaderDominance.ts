"use client";

import { useEffect, type RefObject } from "react";

/**
 * Every screen's <RatesHeader> is `position: fixed` at the same spot (see
 * RatesHeader.tsx) — that's what makes it read as one pinned header instead
 * of each screen's own sticky one jumping around. Without this, whichever
 * screen's header last got attention stays visible on top of / behind the
 * one you're actually looking at.
 *
 * ScreenShell computes this same coverage ratio inline (it also drives the
 * minority-screen blur); this hook is for the two standalone screens that
 * render <RatesHeader> directly (ResultScreen, PaymentScreen) and don't go
 * through ScreenShell at all.
 */
export function useHeaderDominance(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const header = el.querySelector<HTMLElement>("header");
    if (!header) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    const update = () => {
      raf = 0;
      const viewportPx = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const visiblePx = Math.max(
        0,
        Math.min(rect.bottom, viewportPx) - Math.max(rect.top, 0),
      );
      const coverage = viewportPx > 0 ? visiblePx / viewportPx : 0;
      const dominant = coverage >= 0.5;
      header.style.opacity = dominant ? "1" : "0";
      header.style.pointerEvents = dominant ? "" : "none";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    if (!prefersReduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      header.style.opacity = "";
      header.style.pointerEvents = "";
    };
  }, [rootRef]);
}

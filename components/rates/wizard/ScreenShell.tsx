"use client";

import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GaiaBubble } from "../GaiaBubble";
import { RatesHeader } from "../RatesHeader";

interface ScreenShellProps {
  /** Section DOM id (scroll target) — usually flow.stepId(index). */
  id: string;
  index: number;
  total: number;
  /** 0–1 fill for this step's progress marker. */
  completion: number;
  /** Header section label, e.g. "About You". */
  title: string;
  /** Gaia's question. */
  question?: string;
  canAdvance: boolean;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
  /**
   * Width of the CHILDREN + FOOTER column. The footer buttons always match the
   * children width because they share this column. Default = form width.
   * Pass e.g. "max-w-4xl" or "max-w-none" (full) per screen.
   */
  contentClassName?: string;
  /**
   * Optional heading rendered ABOVE the content column, in its own (usually
   * wider) area — so a big title can be wide while the fields/cards and the
   * buttons below stay narrower and aligned to each other.
   */
  heading?: ReactNode;
  /** Width of the heading area (default wide). */
  headingClassName?: string;
  /** The screen's own fields / body. */
  children: ReactNode;
}

/**
 * Shared full-viewport chrome for every wizard screen.
 *
 * The entrance (header shine sweep + field stagger) REPLAYS every time the
 * screen scrolls into view — going down OR back up — driven by an
 * IntersectionObserver. The header is sticky (see RatesHeader), so on a screen
 * taller than the viewport it stays pinned while the content scrolls beneath
 * it with the normal window scroll.
 *
 * Each screen supplies only its own `children` (fields) plus its
 * `completion` / `canAdvance` / `onNext`. All motion is scoped to a
 * gsap.context reverted on unmount (no leaks).
 */
export function ScreenShell({
  id,
  index,
  total,
  completion,
  title,
  question,
  canAdvance,
  nextLabel = "Next",
  onNext,
  onBack,
  contentClassName = "max-w-[684px]",
  heading,
  headingClassName = "max-w-4xl",
  children,
}: ScreenShellProps) {
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const header = el.querySelector<HTMLElement>("header");
    const targets = [header, content].filter(Boolean) as HTMLElement[];
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Reduced-motion: no animation at all, everything sharp and static.
    if (prefersReduced) return;

    // ── Focus-pull blur: only the MINORITY screen blurs ─────────────────────
    // Measure, in pixels, how much of the viewport this screen currently
    // covers. The screen filling the majority (>=50%) stays sharp; the other
    // one (less than 50% on-screen) blurs — more the smaller it gets. So during
    // a transition exactly one screen blurs out, never both. All px-based
    // (getBoundingClientRect + innerHeight) — no vh units.
    const MAX_BLUR = 12;
    let raf = 0;

    const updateBlur = () => {
      raf = 0;
      const viewportPx = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const visiblePx = Math.max(
        0,
        Math.min(rect.bottom, viewportPx) - Math.max(rect.top, 0),
      );
      const coverage = viewportPx > 0 ? visiblePx / viewportPx : 0;
      // >=50% visible → sharp; below that, blur ramps up to MAX at 0% visible.
      const ratio = coverage >= 0.5 ? 0 : (0.5 - coverage) / 0.5;
      const blur = +(ratio * MAX_BLUR).toFixed(2);
      const value = blur < 0.15 ? "" : `blur(${blur}px)`;
      for (const t of targets) t.style.filter = value;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateBlur);
    };

    updateBlur();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // ── Header shine sweep — replays on each fresh entry ─────────────────────
    const ctx = gsap.context(() => {});
    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          inView = true;
          const sweep = el.querySelector<HTMLElement>("[data-header-sweep]");
          if (sweep) {
            ctx.add(() => {
              gsap
                .timeline()
                .fromTo(
                  sweep,
                  { xPercent: -160, autoAlpha: 0 },
                  {
                    xPercent: 380,
                    autoAlpha: 1,
                    duration: 0.9,
                    ease: "power2.inOut",
                  },
                )
                .to(sweep, { autoAlpha: 0, duration: 0.25 }, ">-0.25");
            });
          }
        } else if (!entry.isIntersecting) {
          inView = false;
        }
      },
      { threshold: 0, rootMargin: "0px 0px -70% 0px" },
    );
    io.observe(el);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const t of targets) t.style.filter = "";
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id={id}
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader
        title={title}
        progress={{ total, current: index, completion }}
      />

      <div
        ref={contentRef}
        className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 will-change-[filter]"
      >
        {/* Wide/full heading area — independent of the content column width. */}
        {heading && (
          <div data-stagger className={cn("w-full", headingClassName)}>
            {heading}
          </div>
        )}

        {/* Content column: children AND footer share this width, so the
            buttons are always exactly as wide as the children. */}
        <div className={cn("flex w-full flex-col gap-8", contentClassName)}>
          {question && (
            <div data-stagger className="text-left">
              <GaiaBubble question={question} />
            </div>
          )}

          <div data-stagger>{children}</div>

          <div data-stagger className="grid grid-cols-2 gap-4">
            <Button type="button" variant="muted" onClick={onBack}>
              Back
            </Button>
            <Button
              type="button"
              variant={canAdvance ? "primary" : "muted"}
              disabled={!canAdvance}
              onClick={onNext}
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

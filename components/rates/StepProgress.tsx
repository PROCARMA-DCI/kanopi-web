"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface StepProgressProps {
  /** Total number of steps in the current flow. */
  total: number;
  /** Zero-based index of the active step. */
  current: number;
  /** Fill ratio (0–1) of the active step — how "done" the current page is. */
  completion: number;
}

const DOT = 12; // idle marker size (px)
const PILL = 48; // active marker width (px)

/**
 * Segmented step indicator.
 *  - completed steps → small green dots
 *  - active step     → a wider pill whose green fill tracks `completion`
 *  - upcoming steps  → small grey dots
 *
 * All motion runs inside a single gsap.context that is reverted on unmount,
 * so no tweens or listeners survive the component (no memory leaks).
 */
export function StepProgress({ total, current, completion }: StepProgressProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);

  // One context for the whole component lifetime.
  useEffect(() => {
    ctxRef.current = gsap.context(() => {}, rootRef);
    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  // Re-run whenever the active step or its completion changes.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.add(() => {
      trackRefs.current.forEach((track, i) => {
        if (!track) return;
        const active = i === current;
        gsap.to(track, {
          width: active ? PILL : DOT,
          duration: 0.55,
          ease: "power3.out",
        });

        const fill = fillRefs.current[i];
        if (!fill) return;
        const ratio =
          i < current ? 1 : i === current ? gsap.utils.clamp(0, 1, completion) : 0;
        gsap.to(fill, {
          scaleX: ratio,
          duration: 0.5,
          ease: "power2.out",
        });
      });
    });
  }, [current, completion, total]);

  return (
    <div
      ref={rootRef}
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trackRefs.current[i] = el;
          }}
          className="relative h-3 overflow-hidden rounded-full bg-[rgba(125,135,96,0.18)]"
          style={{ width: DOT }}
        >
          <div
            ref={(el) => {
              fillRefs.current[i] = el;
            }}
            className="absolute inset-0 rounded-full bg-[#a6e00c]"
            style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
          />
        </div>
      ))}
    </div>
  );
}

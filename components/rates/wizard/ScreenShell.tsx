"use client";

import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import { GaiaBubble } from "../GaiaBubble";
import { RatesHeader } from "../RatesHeader";

gsap.registerPlugin(ScrollTrigger);

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
  question: string;
  canAdvance: boolean;
  nextLabel?: string;
  onNext: () => void;
  onBack: () => void;
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
  children,
}: ScreenShellProps) {
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const header = el.querySelector<HTMLElement>("header");
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Reduced-motion: no animation at all, everything sharp and static.
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // The ONE entry effect: a scroll-linked focus pull. Header + content are
      // blurred while the screen is only partly on-screen and sharpen as it
      // settles into view (and re-blur on the way back). No opacity animation,
      // so nothing flickers. Blur is applied to header and content directly
      // (never an ancestor) so the sticky header keeps sticking.
      gsap.fromTo(
        [header, content].filter(Boolean) as HTMLElement[],
        { filter: "blur(12px)" },
        {
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "top 30%",
            scrub: 0.6,
          },
        },
      );
    }, el);

    // Header shine sweep — replays on each fresh entry. It only animates its
    // own gradient bar (never content opacity), so it can't cause flicker.
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
        className="flex flex-1 items-center justify-center px-6 py-16 will-change-[filter]"
      >
        <div className="flex w-full max-w-[684px] flex-col gap-8">
          <div data-stagger className="text-left">
            <GaiaBubble question={question} />
          </div>

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

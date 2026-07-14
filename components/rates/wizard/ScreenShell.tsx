"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { RatesHeader } from "../RatesHeader";
import { GaiaBubble } from "../GaiaBubble";

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
 * Shared full-viewport chrome for every wizard screen: the snap section, the
 * fade/stagger entrance animation, the header with the progress bar, Gaia's
 * question and the Back/Next footer.
 *
 * Each screen component supplies only its own `children` (fields) plus its
 * `completion` / `canAdvance` / `onNext` — so per-screen logic lives entirely
 * in that screen, while the look-and-feel stays consistent here.
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade the section in place (no transform → stable scroll target),
      // then stagger the inner blocks up.
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 })
        .from(
          rootRef.current?.querySelectorAll<HTMLElement>("[data-stagger]") ?? [],
          { autoAlpha: 0, y: 28, duration: 0.55, stagger: 0.1 },
          0.2
        );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id={id}
      style={{ opacity: 0 }} // avoid a flash before the entrance animation runs
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader title={title} progress={{ total, current: index, completion }} />

      <div className="flex flex-1 items-center justify-center px-6 py-16">
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

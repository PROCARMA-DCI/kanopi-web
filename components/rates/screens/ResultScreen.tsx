"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { RatesHeader } from "../RatesHeader";
import { GaiaBubble } from "../GaiaBubble";
import { useFlow } from "../wizard/FlowProvider";
import { COVERAGES, type Coverage } from "../data/coverages";

/**
 * Shared closing screen. Reads the chosen coverage out of the flow's collected
 * `data` and animates its price up. Back → last step, Start over → entry.
 */
export function ResultScreen() {
  const flow = useFlow();
  const rootRef = useRef<HTMLElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  // CoverageScreen passes the full coverage it fetched (real rate or demo
  // fallback) — prefer that over the static list, which only has the demo ids.
  const chosen =
    (flow.data.selectedCoverage as Coverage | null) ??
    COVERAGES.find((c) => c.id === flow.data.coverageId) ??
    COVERAGES[0];
  const price = chosen.price;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: "power3.out" }
      );
      // Header shine sweep left → right, matching the step screens.
      const sweep =
        rootRef.current?.querySelector<HTMLElement>("[data-header-sweep]");
      if (sweep) {
        gsap
          .timeline()
          .fromTo(
            sweep,
            { xPercent: -160, autoAlpha: 0 },
            { xPercent: 380, autoAlpha: 1, duration: 0.9, ease: "power2.inOut" },
            0.15
          )
          .to(sweep, { autoAlpha: 0, duration: 0.25 }, ">-0.25");
      }
      const counter = { v: 0 };
      gsap.to(counter, {
        v: price,
        duration: 1.1,
        delay: 0.4,
        ease: "power2.out",
        onUpdate: () => {
          if (priceRef.current) {
            priceRef.current.textContent =
              Math.round(counter.v).toLocaleString("en-US");
          }
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [price]);

  return (
    <section
      ref={rootRef}
      id={flow.resultId}
      style={{ opacity: 0 }}
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader
        title="Your rate"
        progress={{ total: flow.total, current: flow.total - 1, completion: 1 }}
      />

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-[684px] flex-col gap-8">
          <div className="text-left">
            <GaiaBubble question="All set — here's your personalized estimate." />
          </div>

          <div className="rounded-2xl border border-[#a6e00c] bg-[#fffaf3] p-10 shadow-[0px_2px_10px_rgba(166,224,12,0.3)]">
            <p className="text-[15px] font-medium uppercase tracking-wide text-[#7d8760]">
              {chosen.name} · your estimated price
            </p>
            <p className="mt-2 text-[52px] font-bold leading-none text-[#2d3d00]">
              $<span ref={priceRef}>0</span>
            </p>
            <p className="mt-4 text-[15px] text-[#7d8760]">
              No dealer markups, no hidden fees — just transparent coverage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="muted" onClick={flow.resultBack}>
              Back
            </Button>
            <Button type="button" variant="primary" onClick={flow.restart}>
              Start over
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

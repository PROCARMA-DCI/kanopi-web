"use client";

import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { CoverageCard } from "../CoverageCard";
import { COVERAGES } from "../data/coverages";
import { RatesHeader } from "../RatesHeader";

/**
 * "Looks like you already have a service plan…" (Figma nodes 36:666 / 242:549).
 *
 * Shown instead of CoverageScreen when checkVinWithDetail finds an existing
 * contract for the submitted VIN. The plan card uses the same demo COVERAGES
 * data CoverageScreen already renders — there's no "get my current plan"
 * endpoint yet, only checkVinWithDetail's create_contract flag, so the card
 * itself stays a placeholder until that API exists.
 *
 * `variant`:
 *  - "change" (create_contract === 0) — hard stop: change vehicle or log in.
 *  - "view"   (create_contract === 1) — soft stop: same info, but "View
 *    Coverages" lets them continue into CoverageScreen anyway.
 */
export function ExistingPlanScreen({
  id,
  index,
  total,
  variant,
  vehicleLabel,
  onChangeVehicle,
  onViewCoverages,
  onLogin,
}: {
  id: string;
  index: number;
  total: number;
  variant: "change" | "view";
  /** e.g. "Honda Civic" — the vehicle that was just checked. */
  vehicleLabel?: string;
  onChangeVehicle: () => void;
  onViewCoverages: () => void;
  onLogin: () => void;
}) {
  const plan = COVERAGES[0];
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: "power3.out" },
      );
      const sweep = rootRef.current?.querySelector<HTMLElement>(
        "[data-header-sweep]",
      );
      if (sweep) {
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
            0.15,
          )
          .to(sweep, { autoAlpha: 0, duration: 0.25 }, ">-0.25");
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id={id}
      style={{ opacity: 0 }}
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader
        title="Select Your Coverage"
        progress={{ total, current: index, completion: 1 }}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <span className="flex size-20 items-center justify-center rounded-full border border-[rgba(125,135,96,0.25)] bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[32px] font-bold text-[#2d3d00] shadow-[0px_4px_14px_rgba(129,74,0,0.08)]">
          G
        </span>

        <h1 className="max-w-[684px] text-[36px] font-bold leading-tight text-[#2d3d00] sm:text-[44px]">
          Looks like you already have a service plan for your vehicle.
        </h1>

        <div className="w-full max-w-[684px]">
          <CoverageCard coverage={plan} selected onSelect={() => {}} />
        </div>

        <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
          <p className="text-[18px] font-semibold text-[#666]">
            {variant === "change"
              ? "Would you like to purchase a plan for another vehicle?"
              : `Would you like to purchase a plan for another vehicle${vehicleLabel ? ` (${vehicleLabel})` : ""}?`}
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full cursor-pointer"
            onClick={variant === "change" ? onChangeVehicle : onViewCoverages}
          >
            {variant === "change" ? "Change vehicle" : "View Coverages"}
          </Button>

          <p className="mt-2 text-[18px] font-semibold text-[#666]">
            Or view your current plan?
          </p>
          <Button
            type="button"
            variant="muted"
            className="w-full"
            onClick={onLogin}
          >
            Login
          </Button>
        </div>
      </div>
    </section>
  );
}

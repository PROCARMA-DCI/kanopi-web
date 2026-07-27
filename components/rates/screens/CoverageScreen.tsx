"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { useLoader } from "@/app/providers/LoaderContext";
import { fetching } from "@/lib/api/client";
import { useEffect, useRef, useState } from "react";
import { CoverageCard } from "../CoverageCard";
import { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/**
 * No-account · Step 3 — pick a coverage from the list.
 *
 * Fetches real rate options from getVehicleRates for the vehicle collected
 * earlier in the flow. Falls back to the static `COVERAGES` demo list if the
 * call fails or comes back empty, so the screen never renders blank.
 */
export function CoverageScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { DealerID } = useLayout();
  const { setLoading, loading = true } = useLoader();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [coverages, setCoverages] = useState<planType[]>();
  const canAdvance = selectedId !== null;

  const { state, mileage, vin, existingPlan } = flow.data;

  // React 18/19 dev mode (StrictMode) intentionally double-invokes this
  // effect on mount — this ref dedupes so getVehicleRates only actually
  // fires once per real dependency change, not once per StrictMode replay.
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // const fetchKey = JSON.stringify(existingPlan ?? null);
    // if (lastFetchKeyRef.current === fetchKey) return;
    // lastFetchKeyRef.current = fetchKey;

    let active = true;
    const fetchCoverages = async () => {
      const res = await fetching<{ message?: planType[] }>({
        url: "/api/kanopiPlansList",
        method: "POST",
        body: {
          dealer_id: 4,
          postal_code: 24390,
          state_province: "AL",
          vehicle_mileage: "50000",
          vin_number: "5TDJZRAH2MS062926",
        },
        badgeLoading: "Coverages Checking...",
        setLoading,
      });

      const plans = res.message as planType[] | undefined;
      if (res.success && plans?.length) {
        setCoverages(plans);
      } else {
        setCoverages(undefined);
      }
    };

    fetchCoverages();

    return () => {
      active = false;
    };
  }, [existingPlan]);

  const selectedCoverage =
    coverages?.find((c) => c.plan_id === selectedId) ?? null;

  return (
    !loading && (
      <ScreenShell
        id={flow.stepId(index)}
        index={index}
        total={flow.total}
        completion={canAdvance ? 1 : 0}
        title="Your Coverage"
        // Wide title lives in the `heading` slot; cards + footer share the
        // default content width, so the buttons match the cards.
        heading={
          !coverages ? (
            <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
              Coverages Not Found
            </h1>
          ) : (
            <>
              <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
                Ok, we found {coverages?.length} coverage options available for
                your vehicle.
              </h1>
              <p className="mt-2 text-center text-[#7d8760]">
                Please select one of the following coverage options.
              </p>
            </>
          )
        }
        canAdvance={canAdvance}
        nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
        onNext={() =>
          flow.next(index, { coverageId: selectedId, selectedCoverage })
        }
        onBack={() => flow.back(index)}
      >
        <div
          role="radiogroup"
          aria-label="Coverage options"
          className="grid grid-cols-1 gap-4"
        >
          {coverages?.map((coverage) => (
            <CoverageCard
              key={coverage.reserve_rate_id}
              coverage={coverage}
              selected={selectedId === coverage.reserve_rate_id}
              onSelect={() => setSelectedId(coverage.reserve_rate_id)}
            />
          ))}
        </div>
      </ScreenShell>
    )
  );
}

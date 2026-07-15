"use client";

import { useState } from "react";
import { CoverageCard } from "../CoverageCard";
import { COVERAGES } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/**
 * No-account · Step 3 — pick a coverage from the list.
 *
 * The list and the count in the title come from `COVERAGES` (static now, API
 * later). The user selects exactly one card; the selection is what unlocks Next.
 */
export function CoverageScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canAdvance = selectedId !== null;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Coverage"
      // Wide title lives in the `heading` slot; cards + footer share the
      // default content width, so the buttons match the cards.
      heading={
        <>
          <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
            Ok, we found {COVERAGES.length} coverage options available for your
            vehicle.
          </h1>
          <p className="mt-2 text-center text-[#7d8760]">
            Please select one of the following coverage options.
          </p>
        </>
      }
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={() => flow.next(index, { coverageId: selectedId })}
      onBack={() => flow.back(index)}
    >
      <div
        role="radiogroup"
        aria-label="Coverage options"
        className="grid grid-cols-1 gap-4"
      >
        {COVERAGES.map((coverage) => (
          <CoverageCard
            key={coverage.id}
            coverage={coverage}
            selected={selectedId === coverage.id}
            onSelect={() => setSelectedId(coverage.id)}
          />
        ))}
      </div>
    </ScreenShell>
  );
}

"use client";

import { useState } from "react";
import { ScreenShell } from "../wizard/ScreenShell";
import { useFlow } from "../wizard/FlowProvider";
import { CoverageCard } from "../CoverageCard";
import { COVERAGES } from "../data/coverages";

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
      question={`We found ${COVERAGES.length} coverage options for you.`}
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

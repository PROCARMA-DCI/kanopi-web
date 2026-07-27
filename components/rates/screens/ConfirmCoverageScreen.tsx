"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CoverageCard } from "../CoverageCard";
import type { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

const REQUIRED_TERMS = [
  { key: "noDefects", label: "My vehicle is free of previous defects" },
  {
    key: "waitingPeriod",
    label:
      "I understand that I have to wait 1,000 miles and 30 days before filing a claim becomes valid.",
  },
  {
    key: "paymentsVoid",
    label:
      "I understand that if I stop making payments on my contract, all coverage becomes void and may result in cancellation of this contract; no refund will be due and no claims will be authorized.",
  },
  {
    key: "odometerValid",
    label:
      "I understand that if my odometer entry is not valid, my contract becomes void (will be validated at time of service).",
  },
] as const;

type TermKey = (typeof REQUIRED_TERMS)[number]["key"];

/**
 * No-account · "Nice choice!" (Figma 308:342) — confirms the coverage picked
 * on the previous screen and requires 4 legal acknowledgements before moving
 * on to SignupScreen.
 */
export function ConfirmCoverageScreen({ index }: { index: number }) {
  const flow = useFlow();
  const selectedCoverage = flow.data.selectedCoverage as planType | null;

  const [checked, setChecked] = useState<Record<TermKey, boolean>>({
    noDefects: false,
    waitingPeriod: false,
    paymentsVoid: false,
    odometerValid: false,
  });

  const canAdvance = REQUIRED_TERMS.every((t) => checked[t.key]);

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Coverage"
      heading={
        !selectedCoverage ? (
          <h1 className="text-center text-[52px] font-bold ">
            No coverage Selected
          </h1>
        ) : (
          <>
            <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
              Nice choice!
            </h1>
            <p className="mt-2 text-center text-[20px] font-bold text-[#2d3d00]">
              Please read and check the required boxes below.
            </p>
          </>
        )
      }
      canAdvance={canAdvance}
      onNext={() => flow.next(index, { termsAccepted: true })}
      onBack={() => flow.back(index)}
    >
      {selectedCoverage && (
        <div className="flex flex-col gap-8">
          {selectedCoverage && (
            <CoverageCard coverage={selectedCoverage} variant="owned" />
          )}

          <div className="flex flex-col gap-4">
            {REQUIRED_TERMS.map((term) => (
              <label
                key={term.key}
                className="flex cursor-pointer items-start gap-3"
              >
                <Checkbox
                  checked={checked[term.key]}
                  onCheckedChange={(value) =>
                    setChecked((prev) => ({ ...prev, [term.key]: value }))
                  }
                  className="cursor-pointer"
                />
                <span className="text-[16px] text-[#2d3d00]">{term.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

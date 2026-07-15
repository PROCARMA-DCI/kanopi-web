"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { CAR_MAKES, CAR_YEARS } from "../data/vehicle";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

interface VehicleScreenProps {
  index: number;
  /** Copy differs slightly between flows, so it's a prop. */
  question?: string;
}

/**
 * Shared vehicle screen (used by both flows). It's a leaf component — reusing
 * it keeps things DRY; if the two flows ever need different vehicle logic,
 * copy this file per flow and diverge freely.
 */
export function VehicleScreen({
  index,
  question = "Let's personalize a coverage for your vehicle.",
}: VehicleScreenProps) {
  const flow = useFlow();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");

  const filled = [make, model, year, mileage].filter(
    (v) => v.trim() !== "",
  ).length;
  const completion = filled / 4;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Your Vehicle"
      question={question}
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={() => flow.next(index, { make, model, year, mileage })}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-[684px] mx-auto">
        <Select
          placeholder="Make"
          options={CAR_MAKES}
          value={make}
          onChange={(e) => setMake(e.target.value)}
        />
        <Input
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <Select
          placeholder="Year"
          options={CAR_YEARS}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <Input
          placeholder="Current mileage"
          inputMode="numeric"
          value={mileage}
          onChange={(e) => setMileage(e.target.value.replace(/[^0-9.,]/g, ""))}
        />
      </div>
    </ScreenShell>
  );
}

"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import VinQrCodeRead from "@/components/VinQrCodeRead";
import { useEffect, useMemo, useState } from "react";
import { generateYearsArray } from "../data/vehicle";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

interface VehicleScreenProps {
  index: number;
  /** Copy differs slightly between flows, so it's a prop. */
  question?: string;
}

// VIN is optional — if the user never enters one, submit this 17-char
// placeholder instead of an empty string.
const DEFAULT_VIN = "1".repeat(17);

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
  const { makes, fetchModelAgainstMake, models, fetchMakes } = useLayout();
  const [vin, setVin] = useState("");
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [mileage, setMileage] = useState("");

  useEffect(() => {
    const makeId = makes.find((m) => m.name === make)?.id;
    if (makeId) {
      fetchModelAgainstMake(makeId);
    }
  }, [make]);

  const yearslist = useMemo(
    () =>
      generateYearsArray()
        .sort((a: number, b: number) => b - a)
        .map((year: number) => year.toString()),
    [],
  );
  // Use the makes fetched from the API when available; fall back to the
  // static list until the endpoint is wired up.
  const makeOptions = makes.length ? makes.map((m) => m.name) : [];
  const modelOptions = models.length ? models.map((m) => m.ModelName) : [];
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
      onNext={() =>
        flow.next(index, {
          vin: vin.trim() || DEFAULT_VIN,
          make,
          model,
          year,
          mileage,
        })
      }
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-[684px] mx-auto ">
        <VinQrCodeRead
          vin={vin}
          setVin={setVin}
          onDecoded={({
            make: decodedMake,
            model: decodedModel,
            year: decodedYear,
          }) => {
            setMake(decodedMake || "");
            setModel(decodedModel || "");
            setYear(decodedYear || "");
          }}
        />

        <SelectField
          placeholder="Make"
          options={makeOptions}
          value={make}
          onChange={(v) => {
            setMake(v);
            setModel(""); // model depends on make — clear the stale selection
          }}
        />
        <SelectField
          placeholder="Model"
          options={modelOptions}
          disabled={!make}
          value={model}
          onChange={setModel}
        />

        <SelectField
          placeholder="Year"
          options={yearslist}
          value={year}
          onChange={setYear}
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

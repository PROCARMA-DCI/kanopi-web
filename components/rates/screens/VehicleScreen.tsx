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
  /** Override Camo's question — omit to use the personalized default below. */
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
export function VehicleScreen({ index, question }: VehicleScreenProps) {
  const flow = useFlow();
  const { makes, fetchModelAgainstMake, models, fetchMakes } = useLayout();
  const firstName = (flow.data.firstName as string) || "";
  // Figma: "Awesome! Nice to meet you {FirstName}. Now let's personalize a
  // coverage for your vehicle." — falls back to the generic line if the
  // name isn't in flow.data yet (e.g. this screen used standalone).
  const defaultQuestion = firstName
    ? `Awesome! Nice to meet you ${firstName}.\nNow let's personalize a coverage for your vehicle.`
    : "Let's personalize a coverage for your vehicle.";
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

  // Keep flow.data live as fields change — not just on Next click. Without
  // this, editing a field here AFTER already clicking Next once (e.g. the
  // customer scrolls back from Payment to fix something) silently has no
  // effect unless they click Next again, which read as a bug ("I edited
  // it but it didn't work"). vin defaults the same way onNext does, so a
  // partial/empty VIN never gets sent as an empty string.
  useEffect(() => {
    flow.patch({ vin: vin.trim() || DEFAULT_VIN, make, model, year, mileage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin, make, model, year, mileage]);

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Your Vehicle"
      question={question ?? defaultQuestion}
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={async () => {
        flow.next(index, {
          vin: vin.trim() || DEFAULT_VIN,
          make,
          model,
          year,
          mileage,
        });
      }}
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

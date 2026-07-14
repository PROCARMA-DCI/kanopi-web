"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { states } from "../data/vehicle";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/** No-account · Step 4 — where to send the quote (phone optional). */
export function ContactScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [streetAddress, setStreetAddress] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const filled = [streetAddress, apt, city, state].filter(
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
      title="Stay in touch"
      question="Great to meet you Penelope. What's your Home address? "
      canAdvance={canAdvance}
      nextLabel="See my rate"
      onNext={() => flow.next(index, { streetAddress, apt, city, state })}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Street takes 3/4, Apt takes 1/4 on the same row */}
        <Input
          type="text"
          placeholder="Street address"
          className="sm:col-span-3"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Apt/Unit #"
          className="sm:col-span-1"
          value={apt}
          onChange={(e) => setApt(e.target.value)}
        />
        {/* City and State split the next row */}
        <Input
          type="text"
          placeholder="City"
          className="sm:col-span-2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Select
            placeholder="State"
            options={states}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
      </div>
    </ScreenShell>
  );
}

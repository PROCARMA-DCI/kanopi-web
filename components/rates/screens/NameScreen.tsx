"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/** No-account · Step 1 — the driver's-license name. */
export function NameScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const filled = [firstName, lastName].filter((v) => v.trim() !== "").length;
  const completion = filled / 2;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="About You"
      question="How does your name appear on your driver's license?"
      canAdvance={canAdvance}
      onNext={() => flow.next(index, { firstName, lastName })}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-[684px]">
        <Input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
    </ScreenShell>
  );
}

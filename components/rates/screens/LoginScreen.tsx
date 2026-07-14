"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScreenShell } from "../wizard/ScreenShell";
import { useFlow } from "../wizard/FlowProvider";

/** Yes-account · Step 1 — quick sign-in. */
export function LoginScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const filled = [email, password].filter((v) => v.trim() !== "").length;
  const completion = filled / 2;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Welcome back"
      question="Sign in and we'll pull up your details."
      canAdvance={canAdvance}
      onNext={() => flow.next(index, { email })}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </ScreenShell>
  );
}

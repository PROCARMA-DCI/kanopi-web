"use client";

import { useState } from "react";
import { useScroll } from "@/app/ScrollProvider";
import { EntryScreen } from "./EntryScreen";
import { NoAccountFlow } from "./flows/NoAccountFlow";
import { YesAccountFlow } from "./flows/YesAccountFlow";
import type { RateFlowKey } from "./types";

/**
 * Top-level router for the check-my-rates experience.
 *
 * It only owns the entry choice; each branch is a fully separate flow
 * component with its own <FlowProvider> state. Switching the choice swaps the
 * flow (the old one unmounts and resets).
 */
export function RatesFlow() {
  const [flowKey, setFlowKey] = useState<RateFlowKey | null>(null);
  const { scrollTo } = useScroll();

  function handleEntry(choice: RateFlowKey) {
    // Re-picking the current choice → just scroll back down into it.
    if (choice === flowKey) {
      scrollTo(`${choice}-step-0`);
      return;
    }
    setFlowKey(choice); // the flow's provider scrolls to its first screen on mount
  }

  function handleRestart() {
    setFlowKey(null);
    scrollTo("rates-entry");
  }

  // "Login" from within the no-account flow (e.g. ExistingPlanScreen) swaps
  // straight into the yes-account flow, same as picking "Yes" on entry.
  function handleLogin() {
    setFlowKey("yes-account");
  }

  return (
    <div id="check-rates">
      <EntryScreen selected={flowKey} onSelect={handleEntry} />

      {flowKey === "no-account" && (
        <NoAccountFlow onRestart={handleRestart} onLogin={handleLogin} />
      )}
      {flowKey === "yes-account" && <YesAccountFlow onRestart={handleRestart} />}
    </div>
  );
}

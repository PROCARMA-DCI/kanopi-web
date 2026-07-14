"use client";

import { FlowProvider, useFlow } from "../wizard/FlowProvider";
import { NameScreen } from "../screens/NameScreen";
import { VehicleScreen } from "../screens/VehicleScreen";
import { CoverageScreen } from "../screens/CoverageScreen";
import { ContactScreen } from "../screens/ContactScreen";
import { ResultScreen } from "../screens/ResultScreen";

// The no-account journey, screen by screen. To add / reorder a screen, edit
// this list and bump TOTAL — each screen is its own independent component.
const TOTAL = 4;

function Screens() {
  const flow = useFlow();
  return (
    <>
      {flow.revealed >= 1 && <NameScreen index={0} />}
      {flow.revealed >= 2 && <VehicleScreen index={1} />}
      {flow.revealed >= 3 && <CoverageScreen index={2} />}
      {flow.revealed >= 4 && <ContactScreen index={3} />}
      {flow.finished && <ResultScreen />}
    </>
  );
}

export function NoAccountFlow({ onRestart }: { onRestart: () => void }) {
  return (
    <FlowProvider flowKey="no-account" total={TOTAL} onRestart={onRestart}>
      <Screens />
    </FlowProvider>
  );
}

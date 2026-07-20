"use client";

import { CoverageScreen } from "../screens/CoverageScreen";
import { NameScreen } from "../screens/NameScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { VehicleScreen } from "../screens/VehicleScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

// The no-account journey, screen by screen. To add / reorder a screen, edit
// this list and bump TOTAL — each screen is its own independent component.
const TOTAL = 4;

function Screens() {
  const flow = useFlow();
  return (
    <>
      {flow.revealed >= 1 && <NameScreen index={0} />}
      {flow.revealed >= 2 && <VehicleScreen index={1} />}
      {flow.revealed >= 3 && <SignupScreen index={2} />}
      {flow.revealed >= 4 && <CoverageScreen index={3} />}
      {/* {flow.revealed >= 4 && <ContactScreen index={3} />} */}
      {/* {flow.revealed >= 5 && <AddressScreen index={4} />} */}
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

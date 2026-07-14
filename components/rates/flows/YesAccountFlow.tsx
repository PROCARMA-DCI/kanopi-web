"use client";

import { LoginScreen } from "../screens/LoginScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { VehicleScreen } from "../screens/VehicleScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

// The returning-member journey. Independent of the no-account flow — change one
// without affecting the other.
const TOTAL = 2;

function Screens() {
  const flow = useFlow();
  return (
    <>
      {flow.revealed >= 1 && <LoginScreen index={0} />}
      {flow.revealed >= 2 && (
        <VehicleScreen
          index={1}
          question="Which vehicle are we quoting today?"
        />
      )}
      {flow.finished && <ResultScreen />}
    </>
  );
}

export function YesAccountFlow({ onRestart }: { onRestart: () => void }) {
  return (
    <FlowProvider flowKey="yes-account" total={TOTAL} onRestart={onRestart}>
      <Screens />
    </FlowProvider>
  );
}

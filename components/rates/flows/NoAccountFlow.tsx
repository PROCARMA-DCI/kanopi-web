"use client";

import { CoverageScreen } from "../screens/CoverageScreen";
import { ConfirmCoverageScreen } from "../screens/ConfirmCoverageScreen";
import { CreateAccountScreen } from "../screens/CreateAccountScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { TwoFactorScreen } from "../screens/TwoFactorScreen";
import { VehicleScreen } from "../screens/VehicleScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

// The no-account journey, screen by screen. To add / reorder a screen, edit
// this list and bump TOTAL — each screen is its own independent component.
// CoverageScreen shows any plan(s) already on file above the purchasable
// list itself (see flow.data.existingPlan), so there's no separate
// "existing plan" screen/branch to route between anymore.
const TOTAL = 8;

function Screens() {
  const flow = useFlow();

  return (
    <>
      {flow.revealed >= 1 && <CreateAccountScreen index={0} />}
      {flow.revealed >= 2 && <VehicleScreen index={1} />}
      {flow.revealed >= 3 && <CoverageScreen index={2} />}
      {flow.revealed >= 4 && <ConfirmCoverageScreen index={3} />}
      {flow.revealed >= 5 && <SignupScreen index={4} />}
      {flow.revealed >= 6 && <TwoFactorScreen index={5} />}
      {flow.revealed >= 7 && <OtpScreen index={6} />}
      {flow.revealed >= 8 && <PaymentScreen index={7} />}
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

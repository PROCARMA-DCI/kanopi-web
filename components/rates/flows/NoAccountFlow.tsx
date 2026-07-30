"use client";

import { useEffect } from "react";
import { DemoCoverages } from "../data/coverages";
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

// ⚠️ TEMPORARY — testing PaymentScreen/StripeCheckoutCard/webhook only.
// Set back to false when done: fills every earlier screen with dummy data
// and jumps straight to PaymentScreen on load, so you don't have to click
// through the whole wizard on every reload.
const JUMP_TO_PAYMENT_FOR_TESTING = true;

/** Renders nothing — just fires flow.next() through every earlier step once. */
function TestJumpToPayment() {
  const flow = useFlow();

  useEffect(() => {
    if (flow.revealed > 1) return; // already jumped (or user navigated manually)

    flow.next(0, { firstName: "Test", lastName: "User" });
    flow.next(1, {
      make: "Toyota",
      model: "Camry",
      year: "2020",
      mileage: "45000",
      vin: "1HGCM82633A004352",
    });
    flow.next(2, { selectedCoverage: DemoCoverages[0] });
    flow.next(3, {});
    flow.next(4, {
      email: "test@example.com",
      phone: "5551234567",
      zip: "90210",
      streetAddress: "123 Test St",
      apt: "",
      password: "TestPassword123!",
    });
    flow.next(5, { sendVia: "email" });
    flow.next(6, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function Screens() {
  const flow = useFlow();

  return (
    <>
      {JUMP_TO_PAYMENT_FOR_TESTING && <TestJumpToPayment />}
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

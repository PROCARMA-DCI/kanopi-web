"use client";

import { useScroll } from "@/app/ScrollProvider";
import { planType } from "../data/coverages";
import { CoverageScreen } from "../screens/CoverageScreen";
import { CreateAccountScreen } from "../screens/CreateAccountScreen";
import { ExistingPlanScreen } from "../screens/ExistingPlanScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { VehicleScreen } from "../screens/VehicleScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

// The no-account journey, screen by screen. To add / reorder a screen, edit
// this list and bump TOTAL — each screen is its own independent component.
const TOTAL = 4;

function Screens({ onLogin }: { onLogin: () => void }) {
  const flow = useFlow();

  const { scrollTo } = useScroll();

  const existingPlan = flow.data.existingPlan as planType[] | undefined;

  const vehicleLabel = [flow.data.make, flow.data.model]
    .filter(Boolean)
    .join(" ");
  let step = <CoverageScreen index={2} />;
  if (existingPlan) {
    step = (
      <ExistingPlanScreen
        id={flow.stepId(2)}
        index={2}
        total={flow.total}
        variant="change"
        vehicleLabel={vehicleLabel}
        onChangeVehicle={() => scrollTo(flow.stepId(1))}
        onViewCoverages={() => {}}
        onLogin={onLogin}
      />
    );
  } else {
    step = <CoverageScreen index={2} />;
  }

  return (
    <>
      {flow.revealed >= 1 && <CreateAccountScreen index={0} />}
      {flow.revealed >= 2 && <VehicleScreen index={1} />}
      {flow.revealed >= 3 && step}
      {flow.revealed >= 4 && <SignupScreen index={3} />}
      {flow.finished && <ResultScreen />}
    </>
  );
}

export function NoAccountFlow({
  onRestart,
  onLogin,
}: {
  onRestart: () => void;
  onLogin: () => void;
}) {
  return (
    <FlowProvider flowKey="no-account" total={TOTAL} onRestart={onRestart}>
      <Screens onLogin={onLogin} />
    </FlowProvider>
  );
}

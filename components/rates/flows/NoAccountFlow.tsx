"use client";

import { useScroll } from "@/app/ScrollProvider";
import { useState } from "react";
import { CoverageScreen } from "../screens/CoverageScreen";
import { ExistingPlanScreen } from "../screens/ExistingPlanScreen";
import { NameScreen } from "../screens/NameScreen";
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
  // "View Coverages" on the soft-stop (create_contract === 1) screen just
  // reveals CoverageScreen in the same slot instead of blocking further.
  const [viewAnyway, setViewAnyway] = useState(false);

  const contractCheck = flow.data.contractCheck as {
    create_contract?: number;
    message?: string;
  };

  // Reset "View Coverages" whenever a fresh check comes back (e.g. after
  // "Change vehicle" + re-submitting) — adjusted during render, per React's
  // guidance, instead of a setState-in-effect (which can cascade renders).
  const [prevContractCheck, setPrevContractCheck] = useState(contractCheck);
  if (contractCheck !== prevContractCheck) {
    setPrevContractCheck(contractCheck);
    setViewAnyway(false);
  }

  const vehicleLabel = [flow.data.make, flow.data.model]
    .filter(Boolean)
    .join(" ");
  let step3 = <CoverageScreen index={3} />;
  if (contractCheck?.create_contract == 0) {
    step3 = (
      <ExistingPlanScreen
        id={flow.stepId(3)}
        index={3}
        total={flow.total}
        variant="change"
        vehicleLabel={vehicleLabel}
        onChangeVehicle={() => scrollTo(flow.stepId(1))}
        onViewCoverages={() => {}}
        onLogin={onLogin}
      />
    );
  } else if (
    contractCheck?.create_contract == 1 &&
    contractCheck?.message?.startsWith("No existing")
  ) {
    step3 = <CoverageScreen index={3} />;
  } else if (contractCheck?.create_contract == 1 && !viewAnyway) {
    step3 = (
      <ExistingPlanScreen
        id={flow.stepId(3)}
        index={3}
        total={flow.total}
        variant="view"
        vehicleLabel={vehicleLabel}
        onChangeVehicle={() => {}}
        onViewCoverages={() => setViewAnyway(true)}
        onLogin={onLogin}
      />
    );
  }

  return (
    <>
      {flow.revealed >= 1 && <NameScreen index={0} />}
      {flow.revealed >= 2 && <VehicleScreen index={1} />}
      {flow.revealed >= 3 && <SignupScreen index={2} />}
      {flow.revealed >= 4 && step3}
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

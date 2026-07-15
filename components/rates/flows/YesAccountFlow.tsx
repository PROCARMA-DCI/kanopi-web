"use client";

import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

// Returning-member journey: sign in, then land on the account dashboard.
// Login is the only wizard step; the dashboard is the terminal page.
const TOTAL = 1;

function Screens() {
  const flow = useFlow();
  return (
    <>
      {flow.revealed >= 1 && <LoginScreen index={0} />}
      {flow.finished && <DashboardScreen />}
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

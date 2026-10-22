"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearDashboardRestore,
  readSavedFlowData,
  saveMessagesSession,
  wantsDashboardRestore,
} from "../messagesSession";
import { DashboardScreen } from "../screens/DashboardScreen";
import type {
  dashboardCustomerInfo,
  KanopiLoginData,
  PurchasedPlan,
} from "../screens/LoginScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

const TOTAL = 1;

function Screens() {
  const flow = useFlow();
  const router = useRouter();

  // Messages live on their own /messages page (list + thread side by side),
  // which can't read this flow's in-memory data — so hand over what it
  // needs, then navigate.
  const openMessages = (policy: PurchasedPlan) => {
    const loginData = flow.data.loginData as KanopiLoginData | undefined;
    saveMessagesSession({
      contract: policy,
      customerInfo: flow.data.CustomerInfo as dashboardCustomerInfo | undefined,
      customerId: loginData?.CustomerInfo?.CustomerID,
      flowData: { ...flow.data, contract: policy },
    });
    router.push("/messages");
  };

  return (
    <>
      {flow.revealed >= 1 && <LoginScreen index={0} />}
      {flow.finished && <DashboardScreen onOpenMessages={openMessages} />}
    </>
  );
}

export function YesAccountFlow({ onRestart }: { onRestart: () => void }) {
  // Coming back from /messages → start already finished, with the saved
  // login data, so the dashboard shows instead of the login screen. Only
  // mounts client-side (after GET COVERED), so reading storage here is safe.
  const [restored] = useState(() =>
    wantsDashboardRestore() ? readSavedFlowData() : null,
  );
  useEffect(clearDashboardRestore, []);

  return (
    <FlowProvider
      flowKey="yes-account"
      total={TOTAL}
      onRestart={onRestart}
      initialData={restored ?? undefined}
    >
      <Screens />
    </FlowProvider>
  );
}

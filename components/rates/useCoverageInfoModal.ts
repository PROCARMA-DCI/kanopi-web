"use client";

import { useState } from "react";
import { fetching } from "@/lib/api/client";

interface CoverageLike {
  plan_id: string;
  title: string;
}

/**
 * Shared "See what's covered" / plan-info modal state + fetch logic.
 * CoverageScreen (the plan picker) and DashboardScreen ("View Policies")
 * both need the exact same open→loading→fetch→fill dance against
 * getKanopiCoverageInfo — this is the one place it lives, so a screen
 * just does:
 *
 *   const info = useCoverageInfoModal();
 *   ...
 *   onClick={() => info.openCoverageInfo(somePlan)}
 *   ...
 *   <CoverageInfoModal
 *     open={info.infoOpen}
 *     onClose={info.closeCoverageInfo}
 *     title={info.infoTitle}
 *     loading={info.infoLoading}
 *     error={info.infoError}
 *     descriptionHtml={info.infoHtml}
 *   />
 *
 * `coverage` only needs `plan_id` + `title` — both planType (CoverageScreen)
 * and PurchasedPlan (DashboardScreen) already have those.
 */
export function useCoverageInfoModal() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoTitle, setInfoTitle] = useState("");
  const [infoHtml, setInfoHtml] = useState("");

  // Opens the modal right away (loading state) so the click feels
  // immediate, then fills it in once getKanopiCoverageInfo responds.
  const openCoverageInfo = async (coverage: CoverageLike) => {
    setInfoOpen(true);
    setInfoLoading(true);
    setInfoError("");
    setInfoTitle(coverage.title);
    setInfoHtml("");

    const res = await fetching<{
      PlanID?: string;
      PlanDescription?: string;
      type?: string;
      description?: string;
    }>({
      url: "/api/getKanopiCoverageInfo",
      method: "POST",
      isFormdata: true,
      body: { planid: coverage.plan_id, title: coverage.title },
    });

    setInfoLoading(false);
    if (!res.ok || !res.data?.description) {
      setInfoError("Couldn't load coverage details — please try again.");
      return;
    }

    setInfoTitle(res.data.PlanDescription || coverage.title);
    setInfoHtml(res.data.description);
  };

  const closeCoverageInfo = () => setInfoOpen(false);

  return {
    infoOpen,
    infoLoading,
    infoError,
    infoTitle,
    infoHtml,
    openCoverageInfo,
    closeCoverageInfo,
  };
}

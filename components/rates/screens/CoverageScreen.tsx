"use client";

import { fetching } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CoverageCard } from "../CoverageCard";
import { CoverageInfoModal } from "../CoverageInfoModal";
import { planType } from "../data/coverages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/**
 * checkAlreadyPurchasedPlanForEmail's response shape isn't finalized yet, so
 * this reads a handful of likely field names defensively instead of
 * asserting one exact shape — it degrades gracefully (falls back to the
 * plan's term instead of a blank line) if a field isn't there.
 */
function toDisplayPlan(raw: Record<string, unknown>): planType {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = raw[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return undefined;
  };

  return {
    plan_id: String(pick("plan_id", "PlanID", "id") ?? crypto.randomUUID()),
    title: String(
      pick("title", "Title", "CoverageName", "PlanName") ?? "Your plan",
    ),
    category: String(
      pick("category", "Category", "ProductTypeName") ?? "Service Contract",
    ),
    term: String(pick("term", "Term", "coverage_term") ?? ""),
    deductible: Number(pick("deductible", "Deductible") ?? 0),
    price: Number(pick("price", "Price", "TotalAdminCost") ?? 0),
    coverage_id: Number(pick("coverage_id", "CoverageId") ?? 0),
    product_id: Number(pick("product_id", "ProductId") ?? 0),
    dealer_program_id: Number(
      pick("dealer_program_id", "DealerProgramId") ?? 0,
    ),
    reserve_rate_id: Number(pick("reserve_rate_id", "ReserveRateId") ?? 0),
  };
}

function expiryLabel(raw: Record<string, unknown>): string | undefined {
  const expiry =
    raw.expires_on ??
    raw.ExpirationDate ??
    raw.expiration_date ??
    raw.ExpiryDate;
  return expiry ? `Expires on ${expiry}` : undefined;
}

/**
 * No-account · "Your Coverage" (Figma 355:110) — any plan(s) already on file
 * for this customer show at the top (non-interactive, always highlighted),
 * followed by the purchasable coverage list. Fetches real rate options from
 * kanopiPlansList for the vehicle collected earlier in the flow.
 */
export function CoverageScreen({ index }: { index: number }) {
  const flow = useFlow();

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const canAdvance = selectedId !== null;

  const { existingPlan } = flow.data;
  // VehicleScreen already fetched this list (soft-fetch on its Next button)
  // and passed it through flow.data — this screen only reads it.
  const coverages = flow.data.coverages as planType[] | undefined;
  const existingPlans = existingPlan as Record<string, unknown>[] | undefined;
  const existingPlanCount = existingPlans?.length ?? 0;
  const vehicleLabel = [flow.data.make, flow.data.model]
    .filter(Boolean)
    .join(" ");

  // Clicking a card both selects AND advances — no separate Next button on
  // this screen (see the plain <div>, no onNext/onBack, further down).
  const handleSelect = (coverage: planType) => {
    setSelectedId(coverage.reserve_rate_id);
    flow.next(index, {
      coverageId: coverage.reserve_rate_id,
      selectedCoverage: coverage,
    });
  };
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoTitle, setInfoTitle] = useState("");
  const [infoHtml, setInfoHtml] = useState("");

  // Opens the modal right away (loading state) so the click feels
  // immediate, then fills it in once getKanopiCoverageInfo responds.
  const onGetCoverageInfo = async (coverage: planType) => {
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

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Coverage"
      // Wide title lives in the `heading` slot; cards + footer share the
      // default content width, so the buttons match the cards.
      heading={
        !coverages ? (
          <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
            Coverages Not Found
          </h1>
        ) : existingPlans?.length ? (
          <>
            <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
              {`Looks like you already have a service plan for your ${vehicleLabel || "vehicle"}.`}
            </h1>
          </>
        ) : (
          <>
            <h1 className="text-center text-[52px] font-bold text-[#2D3D00]">
              Ok, we found {coverages?.length} coverage options available for
              your vehicle.
            </h1>
            <p className="mt-2 text-center text-[#7d8760]">
              Please select one of the following coverage options.
            </p>
          </>
        )
      }
      canAdvance={canAdvance}
      // Cards themselves advance (see handleSelect) — no onNext here on
      // purpose. onBack is added ONLY for the "not found" case (a failed/
      // denied kanopiPlansList call, e.g. a bad dealer id): without it,
      // there'd be no cards to click AND no way off this screen at all.
      onBack={!coverages ? () => flow.back(index) : undefined}
    >
      <div className="flex flex-col gap-8">
        {!coverages && (
          <p className="text-center text-[#7d8760]">
            We couldn&apos;t load coverage options for your vehicle right now.
            Go back and try again, or double check your vehicle info.
          </p>
        )}
        {/* Plan(s) already on file — shown above the purchasable list,
              always highlighted, not selectable. */}
        {existingPlans && existingPlans.length > 0 && (
          <div className="grid grid-cols-1 gap-4 shadow p-4 rounded-2xl">
            {existingPlans?.map((raw, i) => {
              const plan = toDisplayPlan(raw);
              return (
                <CoverageCard
                  key={`existing-${plan.plan_id}-${i}`}
                  coverage={plan}
                  variant="owned"
                  highlightOverride={expiryLabel(raw)}
                />
              );
            })}
          </div>
        )}
        {existingPlanCount > 0 && (
          <p className="mt-6 text-center text-[24px] font-bold text-[#2d3d00]">
            {`Would you like to purchase another coverage for your ${vehicleLabel || "vehicle"}?`}
          </p>
        )}
        <div
          role="radiogroup"
          aria-label="Coverage options"
          className={cn(
            "grid grid-cols-1 gap-4",
            existingPlanCount > 0 ? "px-10" : "",
          )}
        >
          {coverages?.map((coverage) => (
            <CoverageCard
              key={coverage.reserve_rate_id}
              coverage={coverage}
              selected={selectedId === coverage.reserve_rate_id}
              onSelect={() => handleSelect(coverage)}
              onMoreInfo={onGetCoverageInfo}
            />
          ))}
        </div>
      </div>

      <CoverageInfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={infoTitle}
        loading={infoLoading}
        error={infoError}
        descriptionHtml={infoHtml}
      />
    </ScreenShell>
  );
}

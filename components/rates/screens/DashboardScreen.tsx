"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { ComponentIcon } from "../ComponentIcon";
import { CoverageInfoModal } from "../CoverageInfoModal";
import { CoveredComponentsModal } from "../CoveredComponentsModal";
import { ACCOUNT, SUMMARY_COMPONENTS } from "../data/account";
import { PolicyDetailModal } from "../PolicyDetailModal";
import { useCoverageInfoModal } from "../useCoverageInfoModal";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";
import type { KanopiLoginData, PurchasedPlan } from "./LoginScreen";

/**
 * Returning-member dashboard shown after login. Same ScreenShell every
 * NoAccountFlow screen uses (header + dominance crossfade + snap-scroll
 * section) — no onNext/onBack, since cards/buttons handle their own
 * navigation, matching CoverageScreen's own no-footer pattern. Profile +
 * policy cards come straight from POST /kanopiLogin's response (saved by
 * LoginScreen as flow.data.loginData) — no demo fallback, since that's a
 * real production API. The right-side coverage-summary/component-tiles
 * section still uses the static ACCOUNT/SUMMARY_COMPONENTS placeholder —
 * no equivalent real endpoint for that part yet.
 */
export function DashboardScreen({
  onOpenMessages,
}: {
  onOpenMessages: (policy: PurchasedPlan) => void;
}) {
  const flow = useFlow();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PurchasedPlan | null>(
    null,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Same "See what's covered" fetch/modal logic CoverageScreen uses for
  // its cards — one shared hook instead of copying the fetch+state dance
  // a second time here.
  const {
    infoOpen,
    infoLoading,
    infoError,
    infoTitle,
    infoHtml,
    openCoverageInfo,
    closeCoverageInfo,
  } = useCoverageInfoModal();

  const loginData = flow.data.loginData as KanopiLoginData | undefined;
  const customer = loginData?.CustomerInfo;
  const fullName = [customer?.FirstName, customer?.LastName]
    .filter(Boolean)
    .join(" ");
  // checkAlreadyPurchasedPlanForEmail's result, saved by LoginScreen —
  // NOT loginData.CoverageImages, which is unrelated design/asset config.
  const policies =
    (flow.data.purchasedPlans as PurchasedPlan[] | undefined) ?? [];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(
        contentRef.current?.querySelectorAll<HTMLElement>("[data-rise]") ?? [],
        {
          autoAlpha: 0,
          y: 28,
          duration: 0.55,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.15,
        },
      );
    }, contentRef);
    return () => ctx.revert();
  }, []);

  return (
    <ScreenShell
      id={flow.resultId}
      index={0}
      total={1}
      completion={1}
      title=""
      canAdvance
      contentClassName="max-w-6xl"
    >
      <div ref={contentRef}>
        {/* Profile — from kanopiLogin's CustomerInfo/MainScreenProfile, no
            demo fallback (this is a real production API). No "joined" date
            exists in that response, so that line is just gone. */}
        <div data-rise className="flex flex-col items-center gap-2">
          {loginData?.MainScreenProfile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loginData.MainScreenProfile}
              alt=""
              className="size-16 rounded-full border-2 border-[#a6e00c] object-cover sm:size-[96px]"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full border-2 border-[#a6e00c] bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[24px] font-bold text-[#2d3d00] sm:size-[96px] sm:text-[38px]">
              {fullName.charAt(0).toUpperCase() || "?"}
            </span>
          )}
          <h1 className="text-[18px] font-medium text-[#2d3d00] sm:text-[25px]">
            {fullName || "—"}
          </h1>
        </div>

        {/* Two columns */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: coverage cards (Figma 745:414) — a fanned stack when
              there's more than one: each earlier card only peeks its top
              (title) above the next one, which sits on top of it (higher
              z-index, pulled up with a negative margin). The LAST one is
              the only one nothing covers, so it's the only one showing its
              full details inline — click ANY card (peeking or not) to see
              its own full details in PolicyDetailModal. Real data now
              includes year/make/model/duration and a real vehicle image
              (checkAlreadyPurchasedPlanForEmail no longer omits these). */}
          <div data-rise className="flex flex-col">
            {policies.map((policy, i) => (
              <div
                key={`${policy.plan_id}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPolicy(policy)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPolicy(policy);
                  }
                }}
                style={{
                  zIndex: i + 1,
                  marginTop: i === 0 ? 0 : -140,
                }}
                className="relative block h-[340px] w-full cursor-pointer rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-5 text-left shadow-[0px_4px_22px_rgba(129,74,0,0.15)] transition-shadow outline-none hover:shadow-[0px_6px_26px_rgba(129,74,0,0.22)] sm:h-[400px] sm:rounded-[40px] sm:p-8"
              >
                <h3 className="max-w-[65%] text-[18px] font-medium text-[#2d3d00] sm:text-[25px]">
                  {policy.title}
                </h3>
                <p className="mt-2 max-w-[65%] text-[14px] font-medium text-[#2d3d00] sm:text-[19px]">
                  {[policy.year, policy.make, policy.model]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p className="mt-1 max-w-[65%] text-[13px] text-[#7b8466] sm:text-[17px]">
                  {policy.term}
                </p>
                <p className="mt-1 max-w-[65%] text-[13px] text-[#7b8466] opacity-75 sm:text-[17px]">
                  {policy.duration}
                </p>
                <p className="mt-3 text-[14px] font-medium text-[#7d8760] sm:text-[19px]">
                  Price:
                </p>
                <p className="text-[14px] text-[#7d8760] opacity-75 sm:text-[19px]">
                  ${policy.price.toLocaleString("en-US")}
                </p>

                {policy.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={policy.image}
                    alt=""
                    className="pointer-events-none absolute right-5 top-5 size-16 object-contain sm:right-8 sm:top-8 sm:size-24"
                  />
                )}

                {/* Per-card actions — View Policies reuses the same "See
                    what's covered" fetch/modal every CoverageScreen card
                    uses; File Claim opens the Messages area (no dedicated
                    "start a claim thread" endpoint exists yet, so this
                    lands on the thread list — swap for a specific
                    threadid once there's a way to know which thread a
                    claim on THIS policy should open). Both stop
                    propagation so they don't also trigger the card's own
                    click (which opens PolicyDetailModal). */}
                <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3 sm:inset-x-8 sm:bottom-8">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCoverageInfo(policy);
                    }}
                    className="h-10 cursor-pointer rounded-xl border-[1.5px] border-[#a6e00c] bg-[#a6e00c] text-[12px] font-bold text-[#2d3d00] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)] sm:h-13 sm:text-[15px]"
                  >
                    View Policies
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMessages(policy);
                    }}
                    className="h-10 cursor-pointer rounded-xl border-[1.5px] border-[#a6e00c] bg-[#fff9f3] text-[12px] font-bold text-[rgba(45,61,0,0.78)] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)] sm:h-13 sm:text-[15px]"
                  >
                    File Claim
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: coverage summary + tiles + button */}
          <div data-rise className="flex flex-col gap-5">
            {/* Summary */}
            <div className="relative rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-5 sm:rounded-[32px] sm:p-7">
              <p className="text-[16px] font-medium text-[#2d3d00] sm:text-[20px]">
                {ACCOUNT.planName}
              </p>
              <div className="mt-4 flex gap-5 text-[13px] text-[#7b8466] sm:gap-10 sm:text-[15px]">
                <div>
                  <p>{ACCOUNT.contract}</p>
                  <p className="opacity-75">{ACCOUNT.planDates}</p>
                </div>
                <div>
                  <p>Deductible:</p>
                  <p className="opacity-75">${ACCOUNT.deductible}</p>
                </div>
              </div>
              <div className="absolute right-5 top-5 size-9 sm:right-7 sm:top-7 sm:size-12">
                <img src={"images/vector.png"} alt="" className="" />
              </div>
            </div>

            {/* Component tiles */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {SUMMARY_COMPONENTS.map((c) => (
                <div key={c.key} className="flex flex-col items-center gap-2">
                  <div className="flex aspect-square w-full items-center justify-center rounded-xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-2 text-[#a6e00c] shadow-[0px_3px_12px_rgba(129,74,0,0.1)] sm:rounded-[24px] sm:p-4">
                    <ComponentIcon name={c.key} />
                  </div>
                  <span className="text-[11px] text-[#2d3d00] opacity-75 sm:text-[13px]">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-13 cursor-pointer rounded-xl border-[1.5px] border-[#a6e00c] bg-[#fff9f3] text-[15px] font-bold text-[rgba(45,61,0,0.78)] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)] sm:h-19.75 sm:rounded-2xl sm:text-[20px]"
            >
              See all covered components
            </button>
          </div>
        </div>
      </div>

      <CoveredComponentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        planName={ACCOUNT.planName}
      />
      <PolicyDetailModal
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        openCoverageInfo={openCoverageInfo}
      />
      <CoverageInfoModal
        open={infoOpen}
        onClose={closeCoverageInfo}
        title={infoTitle}
        loading={infoLoading}
        error={infoError}
        descriptionHtml={infoHtml}
      />
    </ScreenShell>
  );
}

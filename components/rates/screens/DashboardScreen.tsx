"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { ComponentIcon } from "../ComponentIcon";
import { CoveredComponentsModal } from "../CoveredComponentsModal";
import { ACCOUNT, SUMMARY_COMPONENTS } from "../data/account";
import { PolicyDetailModal } from "../PolicyDetailModal";
import { RatesHeader } from "../RatesHeader";
import { useFlow } from "../wizard/FlowProvider";
import { useHeaderDominance } from "../wizard/useHeaderDominance";
import type { KanopiLoginData, PurchasedPlan } from "./LoginScreen";

/**
 * Returning-member dashboard shown after login. A terminal full-screen page
 * (its own header + avatar, no wizard progress/footer). Profile + policy
 * cards come straight from POST /kanopiLogin's response (saved by
 * LoginScreen as flow.data.loginData) — no demo fallback, since that's a
 * real production API. The right-side coverage-summary/component-tiles
 * section still uses the static ACCOUNT/SUMMARY_COMPONENTS placeholder —
 * no equivalent real endpoint for that part yet.
 */
export function DashboardScreen() {
  const flow = useFlow();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PurchasedPlan | null>(
    null,
  );
  const rootRef = useRef<HTMLElement>(null);
  // Matches every NoAccountFlow screen's header treatment (ScreenShell/
  // ResultScreen/PaymentScreen all use this) — this screen was still on
  // its own bespoke `sticky` header with no dominance crossfade, same
  // class of inconsistency EntryScreen had before it was fixed.
  useHeaderDominance(rootRef);

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
        rootRef.current?.querySelectorAll<HTMLElement>("[data-rise]") ?? [],
        {
          autoAlpha: 0,
          y: 28,
          duration: 0.55,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.15,
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id={flow.resultId}
      className="relative flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      <RatesHeader title="" />

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-12 pt-40.5">
        {/* Profile — fully visible, in normal flow below the fixed header
            (no straddling/clipping — that's an EntryScreen-mascot-specific
            trick, wrong fit for an actual profile photo). From kanopiLogin's
            CustomerInfo/MainScreenProfile, no demo fallback (this is a real
            production API). No "joined" date exists in that response, so
            that line is just gone. */}
        <div data-rise className="flex flex-col items-center gap-2">
          {loginData?.MainScreenProfile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loginData.MainScreenProfile}
              alt=""
              className="size-[96px] rounded-full border-2 border-[#a6e00c] object-cover"
            />
          ) : (
            <span className="flex size-[96px] items-center justify-center rounded-full border-2 border-[#a6e00c] bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[38px] font-bold text-[#2d3d00]">
              {fullName.charAt(0).toUpperCase() || "?"}
            </span>
          )}
          <h1 className="text-[25px] font-medium text-[#2d3d00]">
            {fullName || "—"}
          </h1>
        </div>

        {/* Two columns */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: coverage cards — a fanned stack (Figma 55:207) when
              there's more than one: each earlier card only peeks its top
              (title) above the next one, which sits on top of it (higher
              z-index, pulled up with a negative margin). The LAST one is
              the only one nothing covers, so it's the only one showing its
              full details inline — click ANY card (peeking or not) to see
              its own full details in PolicyDetailModal. Straight from
              checkAlreadyPurchasedPlanForEmail — no vehicle/policy-number
              field exists in that data, just plan_id/title/term/price. */}
          <div data-rise className="flex flex-col">
            {policies.map((policy, i) => (
              <button
                key={`${policy.plan_id}-${i}`}
                type="button"
                onClick={() => setSelectedPolicy(policy)}
                style={{
                  zIndex: i + 1,
                  marginTop: i === 0 ? 0 : -140,
                }}
                className="relative block h-[292px] w-full cursor-pointer rounded-[40px] border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-8 text-left shadow-[0px_4px_22px_rgba(129,74,0,0.15)] transition-shadow hover:shadow-[0px_6px_26px_rgba(129,74,0,0.22)]"
              >
                <h3 className="max-w-[70%] text-[25px] font-medium text-[#2d3d00]">
                  {policy.title}
                </h3>
                <p className="mt-3 text-[19px] text-[#7b8466]">{policy.term}</p>
                <p className="mt-4 text-[19px] font-medium text-[#7d8760]">
                  Price:
                </p>
                <p className="text-[19px] text-[#7d8760] opacity-75">
                  ${policy.price.toLocaleString("en-US")}
                </p>

                <div className="pointer-events-none absolute right-6 top-6 size-16 text-[#a6e00c]">
                  <img src={"images/Group3018.png"} alt="" className="" />
                </div>
                <div className="pointer-events-none absolute bottom-4 right-6 h-16 w-28 text-[#c8b58a]">
                  <img src={"images/Group3012.png"} alt="" className="" />
                </div>
              </button>
            ))}
          </div>

          {/* Right: coverage summary + tiles + button */}
          <div data-rise className="flex flex-col gap-5">
            {/* Summary */}
            <div className="relative rounded-[32px] border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-7">
              <p className="text-[20px] font-medium text-[#2d3d00]">
                {ACCOUNT.planName}
              </p>
              <div className="mt-4 flex  gap-10 text-[15px] text-[#7b8466]">
                <div>
                  <p>{ACCOUNT.contract}</p>
                  <p className="opacity-75">{ACCOUNT.planDates}</p>
                </div>
                <div>
                  <p>Deductible:</p>
                  <p className="opacity-75">${ACCOUNT.deductible}</p>
                </div>
              </div>
              <div className="absolute right-7 top-7 size-12">
                <img src={"images/vector.png"} alt="" className="" />
              </div>
            </div>

            {/* Component tiles */}
            <div className="grid grid-cols-4 gap-3">
              {SUMMARY_COMPONENTS.map((c) => (
                <div key={c.key} className="flex flex-col items-center gap-2">
                  <div className="flex aspect-square w-full items-center justify-center rounded-[24px] border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-4 text-[#a6e00c] shadow-[0px_3px_12px_rgba(129,74,0,0.1)]">
                    <ComponentIcon name={c.key} />
                  </div>
                  <span className="text-[13px] text-[#2d3d00] opacity-75">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-[79px] cursor-pointer rounded-2xl border-[1.5px] border-[#a6e00c] bg-[#fff9f3] text-[20px] font-bold text-[rgba(45,61,0,0.78)] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)]"
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
      />
    </section>
  );
}

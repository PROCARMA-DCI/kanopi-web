"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { ComponentIcon } from "../ComponentIcon";
import { CoveredComponentsModal } from "../CoveredComponentsModal";
import { ACCOUNT, SUMMARY_COMPONENTS } from "../data/account";
import { useFlow } from "../wizard/FlowProvider";

/**
 * Returning-member dashboard shown after login. A terminal full-screen page
 * (its own header + avatar, no wizard progress/footer), with policy cards, a
 * coverage summary, component tiles and the "See all covered components" modal.
 */
export function DashboardScreen() {
  const flow = useFlow();
  const [modalOpen, setModalOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

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

  const initial = ACCOUNT.name.charAt(0).toUpperCase();

  return (
    <section
      ref={rootRef}
      id={flow.resultId}
      className="flex min-h-[100dvh] w-full snap-start flex-col bg-[#fff9f1]"
    >
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex h-[98px] items-center bg-[#fff9f1] px-10 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.svg" alt="Kanopi" className="h-[44px] w-auto" />
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Profile */}
        <div data-rise className="flex flex-col items-center gap-2">
          <span className="flex size-[96px] items-center justify-center rounded-full border-2 border-[#a6e00c] bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[38px] font-bold text-[#2d3d00]">
            {initial}
          </span>
          <h1 className="text-[25px] font-medium text-[#2d3d00]">
            {ACCOUNT.name}
          </h1>
          <p className="text-[19px] text-[#7b8466]">{ACCOUNT.joined}</p>
        </div>

        {/* Two columns */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: policy cards */}
          <div data-rise className="flex flex-col gap-5">
            {ACCOUNT.policies.map((policy) => (
              <div
                key={policy.id}
                className="relative overflow-hidden rounded-[40px] border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-8 shadow-[0px_4px_22px_rgba(129,74,0,0.15)]"
              >
                <h3 className="text-[25px] font-medium text-[#2d3d00]">
                  {policy.vehicle}
                </h3>
                <p className="mt-3 text-[19px] text-[#7b8466]">
                  {policy.insured}
                </p>
                <p className="mt-2 text-[19px] text-[#7b8466] opacity-75">
                  {policy.coverageDates}
                </p>
                <p className="mt-4 text-[19px] font-medium text-[#7d8760]">
                  Policy Number:
                </p>
                <p className="text-[19px] text-[#7d8760] opacity-75">
                  {policy.policyNumber}
                </p>

                {/* Decorative leaf + car */}
                <div className="pointer-events-none absolute right-6 top-6 size-16 text-[#a6e00c]">
                  <ComponentIcon name="engine" />
                </div>
                <div className="pointer-events-none absolute bottom-4 right-6 h-16 w-28 text-[#c8b58a]">
                  <ComponentIcon name="chassis" />
                </div>
              </div>
            ))}
          </div>

          {/* Right: coverage summary + tiles + button */}
          <div data-rise className="flex flex-col gap-5">
            {/* Summary */}
            <div className="relative rounded-[32px] border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-7">
              <p className="text-[20px] font-medium text-[#2d3d00]">
                {ACCOUNT.planName}
              </p>
              <div className="mt-4 flex justify-between gap-4 text-[15px] text-[#7b8466]">
                <div>
                  <p>{ACCOUNT.contract}</p>
                  <p className="opacity-75">{ACCOUNT.planDates}</p>
                </div>
                <div>
                  <p>Deductible:</p>
                  <p className="opacity-75">${ACCOUNT.deductible}</p>
                </div>
              </div>
              <div className="absolute right-7 top-7 size-9 text-[#7b8466]">
                <ComponentIcon name="gear" />
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
              className="h-[79px] rounded-2xl border-[1.5px] border-[#a6e00c] bg-[#fff9f3] text-[20px] font-bold text-[rgba(45,61,0,0.78)] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)]"
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
    </section>
  );
}

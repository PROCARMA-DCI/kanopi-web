"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { PurchasedPlan } from "./screens/LoginScreen";

interface PolicyDetailModalProps {
  policy: PurchasedPlan | null;
  onClose: () => void;
}

/**
 * Full plan details (Figma 55:207's "front" card) in a modal, for the
 * stacked cards on DashboardScreen that only show a peek of their title
 * otherwise. Uses the real checkAlreadyPurchasedPlanForEmail shape
 * (plan_id/title/term/price) — no vehicle name or policy number field
 * exists in that data, so this doesn't show either.
 *
 * Portal to <body>, same reasoning as CoverageInfoModal: nothing here sets
 * a live `filter`, but this keeps the pattern consistent and future-proof
 * if DashboardScreen ever grows scroll-driven effects like ScreenShell's.
 */
export function PolicyDetailModal({ policy, onClose }: PolicyDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!policy) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25 },
      );
      gsap.fromTo(
        cardRef.current,
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" },
      );
    });

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      ctx.revert();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [policy, onClose]);

  if (!policy) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={policy.title}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="relative  w-full max-w-[626px] rounded-2xl border-[1.5px]  border-[#7b8466] bg-[#fff9f5] p-5 shadow-[0px_20px_60px_rgba(129,74,0,0.25)] sm:rounded-[40px] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-[rgba(125,135,96,0.15)] text-[#7d8760] transition-colors hover:bg-[rgba(125,135,96,0.28)]"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="max-w-[80%] text-[19px] font-medium text-[#2d3d00] sm:text-[25px]">
          {policy.title}
        </h3>
        <p className="mt-3 text-[19px] text-[#7b8466]">{policy.term}</p>
        <p className="mt-4 text-[19px] font-medium text-[#7d8760]">Price:</p>
        <p className="text-[19px] text-[#7d8760] opacity-75">
          ${policy.price.toLocaleString("en-US")}
        </p>

        {/* <div className="pointer-events-none absolute right-6 top-6 size-16 text-[#a6e00c]">
          <img src={"images/Group3018.png"} alt="" className="" />
        </div> */}
        <div className="pointer-events-none absolute bottom-20 right-6 h-16 w-28 text-[#c8b58a]">
          <img src={policy?.image} alt="" className="" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

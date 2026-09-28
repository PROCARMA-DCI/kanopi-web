"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { PurchasedPlan } from "./screens/LoginScreen";

interface PolicyDetailModalProps {
  policy: PurchasedPlan | null;
  onClose: () => void;
  openCoverageInfo: (coverage: PurchasedPlan) => void;
  onOpenMessages: (policy: PurchasedPlan) => void;
}

/**
 * Full plan details (Figma 745:414's "front" card) in a modal, for the
 * stacked cards on DashboardScreen that only show a peek of their title
 * otherwise. Mirrors that card's fields exactly: title, year/make/model,
 * term, duration, price, and the real vehicle image.
 *
 * Portal to <body>, same reasoning as CoverageInfoModal: nothing here sets
 * a live `filter`, but this keeps the pattern consistent and future-proof
 * if DashboardScreen ever grows scroll-driven effects like ScreenShell's.
 */
export function PolicyDetailModal({
  policy,
  onClose,
  openCoverageInfo,
  onOpenMessages,
}: PolicyDetailModalProps) {
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
        className="relative  block h-[340px] w-full max-w-[626px] rounded-2xl border-[1.5px]  border-[#7b8466] bg-[#fff9f5] p-5 shadow-[0px_20px_60px_rgba(129,74,0,0.25)] sm:rounded-[40px] sm:p-8"
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

        <h3 className="max-w-[65%] text-[18px] font-medium text-[#2d3d00] sm:text-[25px]">
          {policy.title}
        </h3>
        <p className="mt-2 max-w-[65%] text-[14px] font-medium text-[#2d3d00] sm:text-[19px]">
          {[policy.year, policy.make, policy.model].filter(Boolean).join(" ")}
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
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3 sm:inset-x-8 sm:bottom-8">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              openCoverageInfo(policy);
            }}
            className="h-10 cursor-pointer rounded-xl border-[1.5px] border-[#a6e00c] bg-[#fff9f3] text-[12px] font-bold text-[rgba(45,61,0,0.78)] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)] sm:h-13 sm:text-[15px]"
          >
            View Policies
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              onOpenMessages(policy);
            }}
            className="h-10 cursor-pointer rounded-xl border-[1.5px] border-[#a6e00c] bg-[#a6e00c] text-[12px] font-bold text-[#2d3d00] shadow-[0px_4px_10px_rgba(129,74,0,0.1)] transition-shadow hover:shadow-[0px_6px_16px_rgba(166,224,12,0.35)] sm:h-13 sm:text-[15px]"
          >
            File Claim
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

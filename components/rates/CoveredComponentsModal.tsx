"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import { ComponentIcon } from "./ComponentIcon";
import { COVERED_COMPONENTS } from "./data/account";

interface CoveredComponentsModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
}

/**
 * "See all covered components" modal — a scrollable grid of component tiles
 * with a close button and a scroll-down affordance (the little mouse hint from
 * the design) that appears while there's more to see.
 */
export function CoveredComponentsModal({
  open,
  onClose,
  planName,
}: CoveredComponentsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);

  // Open animation + Escape to close + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
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
  }, [open, onClose]);

  const updateScrollHint = () => {
    const el = gridRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
  };

  // Measure on open and on resize/rotate — when everything already fits
  // (big screens) there's nothing to scroll, so the hint must be hidden.
  useEffect(() => {
    if (!open) return;
    updateScrollHint();
    window.addEventListener("resize", updateScrollHint);
    return () => window.removeEventListener("resize", updateScrollHint);
  }, [open]);

  if (!open) return null;

  const scrollDown = () => {
    gridRef.current?.scrollBy({ top: 240, behavior: "smooth" });
  };

  // Portal to <body> — ScreenShell applies a live `filter` (blur) to its
  // content while scrolling, and an ancestor with a filter/transform becomes
  // the containing block for `position: fixed`, which pushes this modal
  // down/off-screen. Same fix as CoverageInfoModal.
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${planName} covered components`}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-2xl border-[1.5px] border-[#a6e00c]/40 bg-[#fff9f5] p-4 shadow-[0px_20px_60px_rgba(129,74,0,0.25)] sm:max-h-[85dvh] sm:rounded-[36px] sm:p-8"
      >
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-center px-10 sm:mb-6">
          <h2 className="text-center text-[20px] font-bold text-[#2d3d00] sm:text-[28px]">
            {planName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex size-8 sm:right-6 sm:top-6 items-center justify-center rounded-full bg-[rgba(125,135,96,0.15)] text-[#7d8760] transition-colors hover:bg-[rgba(125,135,96,0.28)]"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable grid of covered components */}
        <div
          ref={gridRef}
          onScroll={updateScrollHint}
          className="grid min-h-0 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 sm:gap-5 md:grid-cols-5"
        >
          {COVERED_COMPONENTS.map((c, i) => (
            <div key={`${c.key}-${i}`} className="flex flex-col items-center gap-2">
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl border-[1.5px] border-[#a6e00c] bg-[#fff9f5] p-3 text-[#a6e00c] shadow-[0px_3px_12px_rgba(129,74,0,0.08)] sm:rounded-[22px] sm:p-6">
                <ComponentIcon name={c.key} />
              </div>
              <span className="text-center text-[12px] leading-tight text-[#2d3d00] sm:text-[14px]">
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* Scroll-down affordance (hidden once you reach the bottom) */}
        {!atBottom && (
          <button
            type="button"
            onClick={scrollDown}
            aria-label="Scroll for more"
            className="mx-auto mt-4 flex h-9 shrink-0 w-6 items-start justify-center rounded-full border-[1.5px] border-[#a6e00c] pt-1.5 text-[#a6e00c]"
          >
            <svg viewBox="0 0 24 24" className="size-3 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

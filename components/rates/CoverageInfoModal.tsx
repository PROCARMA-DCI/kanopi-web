"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface CoverageInfoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  error: string;
  /** Raw HTML from getKanopiCoverageInfo's `data.description` field. */
  descriptionHtml: string;
}

/**
 * "See what's covered" modal — shows getKanopiCoverageInfo's plan
 * description. Same open animation / Escape-to-close / scroll-lock
 * pattern as CoveredComponentsModal, but the body is real HTML from the
 * API (rendered via dangerouslySetInnerHTML) instead of a static grid, so
 * it's a separate component rather than a variant of that one.
 */
export function CoverageInfoModal({
  open,
  onClose,
  title,
  loading,
  error,
  descriptionHtml,
}: CoverageInfoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Coverage details"}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-[36px] border-[1.5px] border-[#a6e00c]/40 bg-[#fff9f5] p-8 shadow-[0px_20px_60px_rgba(129,74,0,0.25)]"
      >
        <div className="mb-6 flex items-center justify-center">
          <h2 className="text-center text-[26px] font-bold text-[#2d3d00]">
            {title || "Coverage details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-6 top-6 flex size-8 items-center justify-center rounded-full bg-[rgba(125,135,96,0.15)] text-[#7d8760] transition-colors hover:bg-[rgba(125,135,96,0.28)]"
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
        </div>

        <div className="overflow-y-auto pr-1">
          {loading && (
            <p className="text-center text-[15px] text-[#7d8760]">
              Loading coverage details…
            </p>
          )}
          {!loading && error && (
            <p className="text-center text-[15px] text-red-600">{error}</p>
          )}
          {!loading && !error && (
            <div
              className="text-[15px] leading-relaxed text-[#2d3d00] [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

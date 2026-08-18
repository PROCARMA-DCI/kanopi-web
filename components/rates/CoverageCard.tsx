"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import type { planType } from "./data/coverages";

interface CoverageCardProps {
  coverage: planType;
  /** "owned" = an already-purchased plan: always highlighted, not clickable. */
  variant?: "select" | "owned";
  selected?: boolean;
  onSelect?: () => void;
  onMoreInfo?: (coverage: planType) => void;
  /** Overrides the green highlight line — "owned" cards show an expiry date here instead of the term. */
  highlightOverride?: string;
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * One coverage option, matching the Figma card (KANOPI-NO-ACCOUNT · nodes
 * 36:673 / 355:110).
 *
 * `variant="select"` (default) is a radio (click / Enter / Space to select)
 * — selecting applies the green outer border + glow. `variant="owned"`
 * renders an already-purchased plan: always highlighted, not interactive.
 * Either way, "See what's covered" is a nested action, so it's a real
 * <button> that stops propagation (the card itself is a div, not a button,
 * to keep the HTML valid).
 */
export function CoverageCard({
  coverage,
  variant = "select",
  selected = false,
  onSelect,
  onMoreInfo,
  highlightOverride,
}: CoverageCardProps) {
  const isOwned = variant === "owned";
  const highlighted = isOwned || selected;

  return (
    <div
      role={isOwned ? undefined : "radio"}
      aria-checked={isOwned ? undefined : selected}
      tabIndex={isOwned ? undefined : 0}
      onClick={isOwned ? undefined : onSelect}
      onKeyDown={
        isOwned
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
      }
      className={cn(
        "relative w-full rounded-2xl border-[1.5px] bg-[#fffaf3] p-4 text-left outline-none transition-all duration-200 sm:rounded-[36px] sm:p-6",
        "shadow-[0px_3px_14px_rgba(129,74,0,0.15)] focus-visible:ring-2 focus-visible:ring-[#a6e00c]",
        isOwned ? "cursor-default" : "cursor-pointer",
        highlighted
          ? "border-[#a6e00c] opacity-80 shadow-[0px_3px_18px_rgba(166,224,12,0.4)] ring-2 ring-[#a6e00c]"
          : "border-[rgba(125,135,96,0.5)] hover:border-[#a6e00c]/60",
      )}
    >
      {/* Top: name + subtitle, gear icon top-right */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <h4 className="text-[19px] font-bold leading-tight text-[#2d3d00] sm:text-[30px]">
            {coverage.title}
          </h4>
          <p className="text-[14px] text-[#7b8466] sm:text-[19px]">
            {coverage.category}
          </p>
        </div>

        <Image
          src="/images/vector.png"
          width={78}
          height={78}
          alt=""
          className="size-12 shrink-0 sm:size-[78px]"
        />
      </div>

      {/* Green highlight line — "owned" cards show an expiry date instead */}
      <p className="mt-4 text-[19px] font-bold leading-tight text-[#a6e00c] sm:text-[30px]">
        {highlightOverride ?? coverage.term}
      </p>

      {/* Bottom: action button (left) + price block (right) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // don't toggle selection
            onMoreInfo?.(coverage);
          }}
          className="h-11 cursor-pointer rounded-xl border-2 border-[#a6e00c] bg-[#a6e00c] px-5 text-[13px] font-bold text-[#2d3d00] shadow-[0px_3px_12px_rgba(166,224,12,0.6)] transition-opacity hover:opacity-90 sm:h-[51px] sm:px-8 sm:text-[15px]"
        >
          See what&apos;s covered
        </button>

        <div className="flex items-center gap-5 sm:gap-10">
          <div className="flex flex-col">
            <span className="text-[14px] text-[#7b8466] sm:text-[19px]">
              Deductible
            </span>
            <span className="text-[16px] font-bold text-[#2d3d00] sm:text-[22px]">
              Your Price
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[14px] text-[#7b8466] sm:text-[19px]">
              {usd(coverage.deductible)}
            </span>
            <span className="text-[16px] font-bold text-[#2d3d00] sm:text-[22px]">
              {usd(coverage.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        "relative w-full rounded-[36px] border-[1.5px] bg-[#fffaf3] p-6 text-left outline-none transition-all duration-200",
        "shadow-[0px_3px_14px_rgba(129,74,0,0.15)] focus-visible:ring-2 focus-visible:ring-[#a6e00c]",
        isOwned ? "cursor-default" : "cursor-pointer",
        highlighted
          ? "border-[#a6e00c] shadow-[0px_3px_18px_rgba(166,224,12,0.4)] ring-2 ring-[#a6e00c]"
          : "border-[rgba(125,135,96,0.5)] hover:border-[#a6e00c]/60",
      )}
    >
      {/* Top: name + subtitle, gear icon top-right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[30px] font-bold leading-tight text-[#2d3d00]">
            {coverage.title}
          </h4>
          <p className="text-[19px] text-[#7b8466]">{coverage.category}</p>
        </div>

        <Image
          src="/images/vector.png"
          width={78}
          height={78}
          alt=""
          className="shrink-0"
        />
      </div>

      {/* Green highlight line — "owned" cards show an expiry date instead */}
      <p className="mt-4 text-[30px] font-bold leading-tight text-[#a6e00c]">
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
          className="h-[51px] rounded-xl border-2 border-[#a6e00c] bg-[#a6e00c] px-8 text-[15px] font-bold text-[#2d3d00] shadow-[0px_3px_12px_rgba(166,224,12,0.6)] transition-opacity hover:opacity-90"
        >
          See what&apos;s covered
        </button>

        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[19px] text-[#7b8466]">Deductible</span>
            <span className="text-[22px] font-bold text-[#2d3d00]">
              Your Price
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[19px] text-[#7b8466]">
              {usd(coverage.deductible)}
            </span>
            <span className="text-[22px] font-bold text-[#2d3d00]">
              {usd(coverage.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

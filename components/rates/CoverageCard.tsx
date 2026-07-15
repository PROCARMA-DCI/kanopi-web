"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Coverage } from "./data/coverages";

interface CoverageCardProps {
  coverage: Coverage;
  selected: boolean;
  onSelect: () => void;
  onMoreInfo?: (coverage: Coverage) => void;
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * One selectable coverage option, matching the Figma card
 * (KANOPI-NO-ACCOUNT · node 36:673).
 *
 * The whole card is a radio (click / Enter / Space to select) — selecting
 * applies the green outer border + glow. "More Coverage Info" is a nested
 * action, so it's a real <button> that stops propagation (the card itself is a
 * div, not a button, to keep the HTML valid).
 */
export function CoverageCard({
  coverage,
  selected,
  onSelect,
  onMoreInfo,
}: CoverageCardProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative w-full cursor-pointer rounded-[36px] border-[1.5px] bg-[#fffaf3] p-6 text-left outline-none transition-all duration-200",
        "shadow-[0px_3px_14px_rgba(129,74,0,0.15)] focus-visible:ring-2 focus-visible:ring-[#a6e00c]",
        selected
          ? "border-[#a6e00c] shadow-[0px_3px_18px_rgba(166,224,12,0.4)] ring-2 ring-[#a6e00c]"
          : "border-[rgba(125,135,96,0.5)] hover:border-[#a6e00c]/60"
      )}
    >
      {/* Top: name + subtitle, gear icon top-right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[30px] font-bold leading-tight text-[#2d3d00]">
            {coverage.name}
          </h4>
          <p className="text-[19px] text-[#7b8466]">{coverage.subtitle}</p>
        </div>

        {coverage.badge ? (
          <span className="shrink-0 rounded-full bg-[#a6e00c] px-3 py-1 text-[13px] font-bold text-[#2d3d00]">
            {coverage.badge}
          </span>
        ) : (
          <Image
            src="/images/vector.png"
            width={78}
            height={78}
            alt=""
            className="shrink-0"
          />
        )}
      </div>

      {/* Green highlight line */}
      <p className="mt-4 text-[30px] font-bold leading-tight text-[#a6e00c]">
        {coverage.highlight}
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
          More Coverage Info
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

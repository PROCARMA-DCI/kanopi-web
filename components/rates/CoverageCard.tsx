"use client";

import { cn } from "@/lib/utils";
import type { Coverage } from "./data/coverages";

interface CoverageCardProps {
  coverage: Coverage;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One selectable coverage option. All cards share the same layout (they're a
 * list from the API); selecting one applies the green outer border + glow.
 */
export function CoverageCard({ coverage, selected, onSelect }: CoverageCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border bg-[#fff9f1] p-6 text-left transition-all duration-200",
        selected
          ? "border-[#a6e00c] shadow-[0px_2px_14px_rgba(166,224,12,0.35)] ring-2 ring-[#a6e00c]"
          : "border-[rgba(125,135,96,0.5)] hover:border-[#a6e00c]/60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[22px] font-bold text-[#2d3d00]">{coverage.name}</h4>
            {coverage.badge && (
              <span className="rounded-full bg-[#a6e00c] px-2.5 py-0.5 text-[12px] font-bold text-[#2d3d00]">
                {coverage.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-[#7d8760]">{coverage.term}</p>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-[28px] font-bold text-[#2d3d00]">
            ${coverage.price}
          </span>
          <span className="text-[14px] text-[#7d8760]">/mo</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5">
        {coverage.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-[14px] text-[#545e5e]">
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0 text-[#a6e00c]"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {h}
          </li>
        ))}
      </ul>
    </button>
  );
}

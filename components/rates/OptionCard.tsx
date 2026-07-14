"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Radio-style choice card (the "Yes / Nope" options on the entry screen).
 * Selected state = green outline + glow + filled check, per Figma.
 */
export function OptionCard({ label, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex h-[79px] w-[239px] items-center justify-between rounded-2xl border px-5 text-[20px] font-bold transition-all duration-200",
        selected
          ? "border-[#a6e00c] bg-[#fffaf3] text-[#2d3d00] shadow-[0px_2px_10px_rgba(166,224,12,0.3)]"
          : "border-[rgba(125,135,96,0.5)] bg-[#fff9f1] text-[rgba(125,135,96,0.9)] hover:border-[#a6e00c]/60"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "flex size-[31px] items-center justify-center rounded-full border transition-colors duration-200",
          selected
            ? "border-[#c8ff3e] bg-[#a6e00c] text-[#2d3d00]"
            : "border-[rgba(125,135,96,0.5)] bg-[rgba(125,135,96,0.1)]"
        )}
      >
        {selected && (
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
    </button>
  );
}

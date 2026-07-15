"use client";

import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

/** Small square checkbox (24px, rounded) — matches the Figma agreement rows. */
export function Checkbox({
  checked,
  onCheckedChange,
  id,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
        checked
          ? "border-[#a6e00c] bg-[#a6e00c] text-[#2d3d00]"
          : "border-[rgba(125,135,96,0.5)] bg-[#fff9f1] hover:border-[#a6e00c]/60",
        className,
      )}
    >
      {checked && (
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
    </button>
  );
}

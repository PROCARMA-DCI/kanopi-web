import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Rate-flow dropdown — styled native <select> so it needs no extra
 * dependency and stays keyboard/screen-reader accessible. The chevron
 * matches the Figma "Make / Model / Year" fields.
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: string[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, placeholder, options, value, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        value={value}
        className={cn(
          "h-[79px] w-full appearance-none rounded-2xl border border-[rgba(125,135,96,0.5)] bg-[#fff9f1] px-5 pr-12 text-[20px] outline-none",
          "transition-[border-color,box-shadow] duration-200",
          "focus:border-[#a6e00c] focus:shadow-[0px_2px_10px_rgba(166,224,12,0.25)]",
          value ? "text-[#2d3d00]" : "text-[#7d8760]",
          className
        )}
        {...props}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-[#2d3d00]">
            {opt}
          </option>
        ))}
      </select>
      {/* chevron */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#7d8760]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
);
Select.displayName = "Select";

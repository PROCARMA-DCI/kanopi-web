import * as React from "react";
import { cn } from "@/lib/utils";

/** Rate-flow text input — matches the 79px rounded field in the Figma design. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-[79px] w-full rounded-2xl border border-[rgba(125,135,96,0.5)] bg-[#fff9f1] px-5 text-[20px] text-[#2d3d00]",
      "placeholder:text-[#7d8760] placeholder:font-normal outline-none",
      "transition-[border-color,box-shadow] duration-200",
      "focus:border-[#a6e00c] focus:shadow-[0px_2px_10px_rgba(166,224,12,0.25)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

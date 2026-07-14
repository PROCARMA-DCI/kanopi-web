import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Kanopi rate-flow button. Mirrors the Figma states:
 *  - primary : active CTA — green outline + soft glow (enabled "Next")
 *  - muted   : inactive / secondary — faint olive fill (disabled "Next", "Back")
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold text-[20px] leading-none select-none transition-[box-shadow,background-color,border-color,transform] duration-200 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6e00c]/60",
  {
    variants: {
      variant: {
        primary:
          "bg-[#fffaf3] text-[#2d3d00] border border-[#a6e00c] shadow-[0px_2px_10px_rgba(166,224,12,0.3)] hover:shadow-[0px_5px_18px_rgba(166,224,12,0.45)] hover:-translate-y-0.5 active:translate-y-0",
        muted:
          "bg-[rgba(125,135,96,0.1)] text-[rgba(38,51,1,0.5)] border border-[rgba(125,135,96,0.5)] hover:bg-[rgba(125,135,96,0.16)]",
      },
      size: {
        default: "h-[79px] px-6",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };

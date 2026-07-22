import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Kanopi rate-flow button. Mirrors the Figma "Button States" reference:
 *  - primary : Active / Active (Hover) — white fill, olive border/text at
 *    rest, brightens to the accent green + glow on hover (enabled "Next").
 *  - muted   : Inactive / Back-Button Hover — faint olive fill + muted text
 *    at rest (disabled "Next"); on hover (the clickable "Back" button) it
 *    solidifies to a filled olive-gray with white text.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold text-[20px] leading-none select-none transition-[box-shadow,background-color,color,border-color,transform] duration-200 disabled:pointer-events-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6e00c]/60",
  {
    variants: {
      variant: {
        primary:
          "bg-[#fffaf3] text-[#2d3d00] border border-[rgba(45,61,0,0.3)] shadow-[0px_2px_10px_rgba(129,74,0,0.1)] hover:border-[#c8ff3e] hover:shadow-[0px_0px_24px_rgba(200,255,62,0.2)] ",
        muted:
          "bg-[rgba(125,135,96,0.1)] text-[rgba(38,51,1,0.5)] border border-[rgba(125,135,96,0.5)] hover:bg-[#7d8760] hover:text-white hover:border-[#7d8760]",
      },
      size: {
        default: "h-[79px] px-6",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Rate-flow text input — shadcn-style, driven by the semantic theme tokens
 * (see globals.css): border-input / bg-background / text-foreground /
 * placeholder-muted-foreground / focus ring in primary. Change the palette in
 * globals.css and every input follows.
 */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-13 w-full rounded-xl border border-input bg-background px-4 text-[15px] text-foreground sm:h-19.75 sm:rounded-2xl sm:px-5 sm:text-[20px]",
      "placeholder:font-normal placeholder:text-muted-foreground outline-none",
      "transition-[border-color,box-shadow] duration-200",
      "focus:border-primary focus:shadow-[0px_2px_10px_rgba(166,224,12,0.25)]",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

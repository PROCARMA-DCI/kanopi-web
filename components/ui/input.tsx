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
      "h-[79px] w-full rounded-2xl border border-input bg-background px-5 text-[20px] text-foreground",
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

import { cn } from "@/lib/utils";

/**
 * Simple themed spinner. Use inline anywhere (buttons, cards):
 *   <Loader />            // default 24px
 *   <Loader size={40} />
 * For a full-screen loader during API calls, use the LoaderProvider + useLoader.
 */
export function Loader({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-4 border-primary/30 border-t-primary",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

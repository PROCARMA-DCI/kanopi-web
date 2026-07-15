import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Line-art icons for covered vehicle components, in the Kanopi green outline
 * style. These approximate the Figma illustrations (the exact multi-path art
 * isn't available as committable assets); swap for the real SVGs when exported.
 */
const ICONS: Record<string, ReactNode> = {
  engine: (
    <>
      <path d="M5 9h3l2-2h4v2h3l2 2h2v4h-2v3H9l-4-4H3v-3l2-2Z" />
      <path d="M10 7V4h4v3" />
    </>
  ),
  transmission: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v10M8 17h8M8 12h8" />
    </>
  ),
  electrical: <path d="M13 2 4 14h6l-1 8 10-12h-6l1-8Z" />,
  chassis: (
    <>
      <path d="M3 8h18M4 8v7m16-7v7M4 15h16" />
      <circle cx="7.5" cy="17" r="1.6" />
      <circle cx="16.5" cy="17" r="1.6" />
    </>
  ),
  cooling: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M6 8h12M6 12h12M6 16h12M10 4v16M14 4v16" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 20h12" />
      <path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-2-2" />
    </>
  ),
  steering: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 14.5V21M9.6 11 3.5 8.5M14.4 11l6.1-2.5" />
    </>
  ),
  brakes: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    </>
  ),
  suspension: <path d="M6 3v4M6 7c0 2-3 2-3 4s3 2 3 4-3 2-3 4M18 3v4M18 7c0 2 3 2 3 4s-3 2-3 4 3 2 3 4M6 21h12" />,
  ac: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    </>
  ),
  axle: (
    <>
      <path d="M4 12h16" />
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="19" cy="12" r="2.5" />
      <path d="M9 12a3 3 0 0 1 6 0" />
    </>
  ),
  turbo: (
    <>
      <circle cx="10" cy="13" r="5" />
      <path d="M10 13 13 8M14 4h6M17 4v5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </>
  ),
};

export function ComponentIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-full", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name] ?? ICONS.gear}
    </svg>
  );
}

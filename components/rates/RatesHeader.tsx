import { StepProgress } from "./StepProgress";

interface RatesHeaderProps {
  title: string;
  /** Progress data — omit to hide the indicator (e.g. on the entry screen). */
  progress?: { total: number; current: number; completion: number };
}

/**
 * Sticky top bar: Kanopi mark left, centred title + step progress.
 *
 * `sticky top-0` keeps it pinned (via the normal window scroll — no nested
 * scrollbar) while a taller-than-viewport screen scrolls beneath it; it
 * releases naturally when the section ends.
 *
 * The `data-header-sweep` span is a light bar that ScreenShell animates
 * left→right each time the screen is entered.
 */
export function RatesHeader({ title, progress }: RatesHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[98px] items-center overflow-hidden bg-[#fff9f1] px-10 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)]">
      {/* Left→right shine sweep (animated by ScreenShell on screen entry). */}
      <span
        aria-hidden
        data-header-sweep
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[#a6e00c]/25 to-transparent opacity-0"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo.svg" alt="Kanopi" className="h-[44px] w-auto" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <span className="text-[20px] font-bold leading-none text-[#2d3d00]">
          {title}
        </span>
        {progress && (
          <StepProgress
            total={progress.total}
            current={progress.current}
            completion={progress.completion}
          />
        )}
      </div>
    </header>
  );
}

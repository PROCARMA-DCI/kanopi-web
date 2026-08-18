import { StepProgress } from "./StepProgress";

interface RatesHeaderProps {
  title: string;
  /** Progress data — omit to hide the indicator (e.g. on the entry screen). */
  progress?: { total: number; current: number; completion: number };
}

/**
 * Fixed top bar: Kanopi mark left, centred title + step progress.
 *
 * `fixed` pins it to the viewport permanently — it never moves as the page
 * scrolls. Every screen renders its own <RatesHeader>, all stacked at the
 * exact same fixed position; ScreenShell fades out every screen's header
 * except the currently-dominant one's (opacity, not position), so only one
 * is ever visible — the "changing" effect is a crossfade of CONTENT, not the
 * header repositioning itself.
 *
 * The `data-header-sweep` span is a light bar that ScreenShell animates
 * left→right each time the screen is entered.
 */
export function RatesHeader({ title, progress }: RatesHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-[72px] items-center overflow-hidden bg-[#fff9f1] px-4 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)] transition-[opacity,filter] duration-200 sm:h-[98px] sm:px-10">
      {/* Left→right shine sweep (animated by ScreenShell on screen entry). */}
      <span
        aria-hidden
        data-header-sweep
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[#a6e00c]/25 to-transparent opacity-0"
      />

      {}
      <img
        src="/images/logo.png"
        alt="Kanopi"
        className="h-[30px] w-auto sm:h-[44px]"
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex max-w-[60%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 sm:max-w-none sm:gap-2">
        <span className="truncate text-[13px] font-bold leading-none text-[#2d3d00] sm:text-[20px]">
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

import { StepProgress } from "./StepProgress";

interface RatesHeaderProps {
  title: string;
  /** Progress data — omit to hide the indicator (e.g. on the entry screen). */
  progress?: { total: number; current: number; completion: number };
}

/** Sticky top bar: Kanopi mark on the left, centred title + step progress. */
export function RatesHeader({ title, progress }: RatesHeaderProps) {
  return (
    <header className="relative flex h-[98px] items-center bg-[#fff9f1] px-10 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)]">
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

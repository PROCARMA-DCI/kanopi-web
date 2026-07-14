"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useScroll } from "@/app/ScrollProvider";
import type { RateFlowKey } from "../types";

/**
 * Per-flow controller.
 *
 * Each flow (no-account / yes-account) mounts its OWN <FlowProvider>, so the
 * two flows have completely independent state. Screens read navigation + the
 * collected data from `useFlow()`; they keep their own field state locally,
 * which is exactly what lets one screen change (multi-select, extra fields…)
 * without touching any other screen or the other flow.
 */
interface FlowContextValue {
  flowKey: RateFlowKey;
  /** Total number of steps in this flow (drives the progress bar). */
  total: number;
  /** How many screens are currently revealed (1 = only the first). */
  revealed: number;
  /** Whether the closing result screen is showing. */
  finished: boolean;
  /** All values collected so far — ready to POST to the API later. */
  data: Record<string, unknown>;
  /** DOM id for a step section, e.g. "no-account-step-2". */
  stepId: (index: number) => string;
  /** DOM id for this flow's result section. */
  resultId: string;
  /** Advance from `index`, merging this screen's `patch` into `data`. */
  next: (index: number, patch?: Record<string, unknown>) => void;
  /** Go back one screen from `index` (or to the entry screen from step 0). */
  back: (index: number) => void;
  /** Back button on the result screen → last step. */
  resultBack: () => void;
  /** Reset everything and return to the entry choice. */
  restart: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

interface FlowProviderProps {
  flowKey: RateFlowKey;
  total: number;
  /** Called when the user restarts — lets the parent reset the entry choice. */
  onRestart: () => void;
  children: ReactNode;
}

export function FlowProvider({
  flowKey,
  total,
  onRestart,
  children,
}: FlowProviderProps) {
  const { scrollTo } = useScroll();
  const [revealed, setRevealed] = useState(1); // first screen shows immediately
  const [finished, setFinished] = useState(false);
  const [data, setData] = useState<Record<string, unknown>>({});

  const stepId = (index: number) => `${flowKey}-step-${index}`;
  const resultId = `${flowKey}-result`;

  // Scroll to the deepest revealed screen (or the result) whenever it changes.
  useEffect(() => {
    if (finished) scrollTo(resultId);
    else scrollTo(stepId(revealed - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, finished]);

  const value = useMemo<FlowContextValue>(() => {
    function next(index: number, patch?: Record<string, unknown>) {
      if (patch) setData((prev) => ({ ...prev, ...patch }));
      // Already-revealed screen → just move down to the next one.
      if (index < revealed - 1) {
        scrollTo(stepId(index + 1));
        return;
      }
      // Deepest screen → reveal the next, or finish.
      if (index < total - 1) setRevealed(index + 2);
      else setFinished(true);
    }

    function back(index: number) {
      if (index === 0) scrollTo("rates-entry");
      else scrollTo(stepId(index - 1));
    }

    function resultBack() {
      scrollTo(stepId(total - 1));
    }

    function restart() {
      setRevealed(1);
      setFinished(false);
      setData({});
      onRestart();
    }

    return {
      flowKey,
      total,
      revealed,
      finished,
      data,
      stepId,
      resultId,
      next,
      back,
      resultBack,
      restart,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowKey, total, revealed, finished, data]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

/** Access the current flow's controller. Throws if used outside a FlowProvider. */
export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside a <FlowProvider>");
  return ctx;
}

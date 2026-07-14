"use client";

import { useScroll } from "@/app/ScrollProvider";

/**
 * The hero "CHECK YOUR DEAL" button.
 *
 * It's a client component purely so it can use the shared scroll provider:
 * clicking it smoothly scrolls down into the rate-check flow (<div id="check-rates">).
 * Keeps the same classes as before so the existing styling is untouched.
 */
export function IntroCheckDealButton() {
  const { scrollTo } = useScroll();

  return (
    <button
      type="button"
      className="intro__btn textBtn btn"
      onClick={() => scrollTo("check-rates")}
    >
      CHECK YOUR DEAL
    </button>
  );
}

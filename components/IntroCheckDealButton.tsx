"use client";

import { useScroll } from "@/app/ScrollProvider";

/**
 * The hero "CHECK YOUR DEAL" button.
 *
 * It's a client component purely so it can use the shared scroll provider:
 * clicking it smoothly scrolls down to the GET COVERED section (the rates flow
 * itself stays hidden until that section's button is clicked).
 * Keeps the same classes as before so the existing styling is untouched.
 */
export function IntroCheckDealButton() {
  const { scrollTo } = useScroll();

  return (
    <button
      type="button"
      className="intro__btn textBtn btn"
      onClick={() => scrollTo("get-covered")}
    >
      CHECK YOUR DEAL
    </button>
  );
}

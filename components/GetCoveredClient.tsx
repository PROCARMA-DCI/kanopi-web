"use client";

import { useScroll } from "@/app/ScrollProvider";
import { RatesFlow } from "@/components/rates/RatesFlow";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * "Coverage where you need it." — client half.
 *
 * Left: headline + card (jeep-leaf illustration, GET COVERED, "as low as").
 * Right: car_animation.json — the real Lottie, which already animates each
 * covered part (brakes, suspension, HVAC, engine, transmission) together
 * with its repair-cost label, so there's no separate GSAP callout system to
 * keep in sync here — it just plays.
 *
 * GATE: the rates flow (Yes/No entry screen and everything after) does not
 * exist in the DOM until GET COVERED is clicked; clicking reveals it and
 * smooth-scrolls down to the entry screen.
 */
export function GetCoveredClient({
  carAnimation,
}: {
  carAnimation: object;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const { scrollTo } = useScroll();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Reduced motion: freeze on a frame that still shows a part + its price,
    // instead of looping the animation forever.
    if (prefersReduced) lottieRef.current?.goToAndStop(444, true);

    const ctx = gsap.context(() => {
      // Jeep-leaf illustration on the card bobs gently.
      if (!prefersReduced) {
        gsap.to("[data-jeep]", {
          y: -8,
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // Entrance (plays once when the section scrolls into view).
      gsap.from(el.querySelectorAll<HTMLElement>("[data-rise]"), {
        autoAlpha: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 70%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const handleGetCovered = () => {
    setUnlocked(true); // mounts the rates flow below
    scrollTo("rates-entry"); // ScrollProvider waits for it to be in the DOM
  };

  return (
    <>
      <section
        ref={rootRef}
        id="get-covered"
        className="flex min-h-[100dvh] w-full snap-start flex-col justify-center overflow-hidden bg-[#fff9f1] px-6 py-16 lg:px-[100px]"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          {/* Headline */}
          <h2
            data-rise
            className="text-[36px] font-bold leading-tight text-[#2d3d00] sm:text-[52px]"
          >
            Coverage where you need it.
          </h2>
          <p
            data-rise
            className="mt-2 pl-1 text-[20px] text-[#2d3d00] sm:text-[28px]"
          >
            Important parts are expensive parts...
          </p>

          <div className="mt-10 flex flex-col justify-between items-center gap-12 lg:flex-row lg:items-center">
            {/* Card: jeep-leaf + CTA */}
            <div
              data-rise
              className="w-full max-w-[406px] shrink-0 rounded-[32px] bg-[#fff9f1] px-8 pb-8 pt-4 text-center shadow-[0px_4px_28.5px_rgba(129,74,0,0.2)]"
            >
              <Image
                data-jeep
                src="/images/jeep-leaf.png"
                alt="Jeep sheltered under a leaf"
                width={275}
                height={275}
                className="mx-auto object-contain"
              />
              <button
                type="button"
                onClick={handleGetCovered}
                className="mt-2 h-[79px] cursor-pointer duration-300 transition-all w-full max-w-[298px] rounded-[19px] bg-[#a6e00c] text-[26px] font-black tracking-wide text-[#2d3d00] shadow-[0px_6px_24px_rgba(166,224,12,0.55)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0px_10px_30px_rgba(166,224,12,0.7)] active:translate-y-0"
              >
                GET COVERED
              </button>
              <p className="mt-4 text-[18px] font-bold text-[rgba(57,68,68,0.5)]">
                AS LOW AS $30/MO
              </p>
            </div>

            {/* Jeep schematic — the real Lottie, parts + price labels baked in */}
            <div
              data-rise
              className="relative mx-auto w-full max-w-120 flex-1 lg:max-w-[600px]"
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={carAnimation}
                loop
                autoplay
                className="mx-auto h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Yes/No entry screen (and the whole rates flow) stays out of the
          DOM until GET COVERED is clicked. */}
      {unlocked && <RatesFlow />}
    </>
  );
}

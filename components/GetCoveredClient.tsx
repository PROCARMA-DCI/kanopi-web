"use client";

import { useScroll } from "@/app/ScrollProvider";
import { RatesFlow } from "@/components/rates/RatesFlow";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * The repair callouts cycled over the jeep schematic. Each entry maps a part
 * overlay in calculator-car.svg to its label + typical repair cost chip.
 */
const PARTS = [
  {
    targets: "#car_powertrain",
    label: "Transmission Repair",
    price: "-$3,200",
  },
  {
    targets: "#car_tires, #wheel",
    label: "Tire & Wheel Replacement",
    price: "-$1,100",
  },
  {
    targets: "#car_windshield-protect",
    label: "Windshield Replacement",
    price: "-$1,450",
  },
  {
    targets: "#car_paint-protect",
    label: "Paint Correction",
    price: "-$2,000",
  },
];

/**
 * "Coverage where you need it." — client half.
 *
 * Left: headline + card (jeep-leaf illustration, GET COVERED, "as low as").
 * Right: the jeep schematic; GSAP cycles each covered part (powertrain, tires,
 * windshield, paint) with a matching repair-cost callout — replacing the
 * design's Lottie.
 *
 * GATE: the rates flow (Yes/No entry screen and everything after) does not
 * exist in the DOM until GET COVERED is clicked; clicking reveals it and
 * smooth-scrolls down to the entry screen.
 */
export function GetCoveredClient({ carSvg }: { carSvg: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  const { scrollTo } = useScroll();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      // Start hidden: every part overlay + the callout chips. (The stray
      // tire-line strokes are hidden like the original calculator init did.)
      gsap.set(
        "#car_powertrain, #car_tires, #wheel, #car_windshield-protect, #car_paint-protect",
        { autoAlpha: 0 },
      );
      gsap.set("#tire-line-3, #tire-line-2-3, #tire-line-6, #tire-line-2-6", {
        opacity: 0,
      });
      gsap.set("[data-chip]", { autoAlpha: 0 });

      if (prefersReduced) {
        // No motion: show the first part + its callout statically.
        gsap.set(PARTS[0].targets, { autoAlpha: 1 });
        gsap.set('[data-chip="0"]', { autoAlpha: 1 });
        return;
      }

      // ── Part / callout cycle ───────────────────────────────────────────
      const cycle = gsap.timeline({ repeat: -1 });
      PARTS.forEach((part, i) => {
        const chip = `[data-chip="${i}"]`;
        cycle
          .to(part.targets, { autoAlpha: 1, duration: 0.4 })
          .fromTo(
            chip,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
            "<",
          )
          .to(part.targets, { autoAlpha: 0, duration: 0.4 }, "+=1.7")
          .to(chip, { autoAlpha: 0, duration: 0.3 }, "<");
      });

      // ── Idle life ──────────────────────────────────────────────────────
      // Jeep-leaf illustration bobs gently.
      gsap.to("[data-jeep]", {
        y: -8,
        duration: 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      // Tire tracks drift behind the wheels.
      gsap
        .timeline({ repeat: -1, defaults: { ease: "none" } })
        .fromTo(
          "#car_tire-track-1, #car_tire-track-2",
          { x: -30, y: 30, autoAlpha: 1 },
          { x: 30, y: -30, duration: 2.2 },
        )
        .to(
          "#car_tire-track-1, #car_tire-track-2",
          { autoAlpha: 0, duration: 0.3 },
          "-=0.3",
        );

      // ── Entrance (plays once when the section scrolls into view) ────────
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

            {/* Jeep schematic + cycling repair callouts */}
            <div
              data-rise
              className="relative mx-auto w-full max-w-120 flex-1  lg:max-w-[600px]"
            >
              <div
                aria-hidden
                className="[&>svg]:h-auto [&>svg]:w-full [&>svg]:max-h-full [&>svg]:mx-auto "
                dangerouslySetInnerHTML={{ __html: carSvg }}
              />

              {/* One callout pair per part — GSAP fades each in during its
                  phase of the cycle. */}
              {PARTS.map((part, i) => (
                <div
                  key={part.label}
                  data-chip={i}
                  className="pointer-events-none absolute inset-0"
                >
                  <span className="absolute left-0 top-[42%] rounded-full bg-[#2d3d00] px-4 py-2 text-[15px] font-bold text-[#fff9f1] shadow-[0px_4px_12px_rgba(45,61,0,0.35)] sm:text-[17px]">
                    {part.label}
                  </span>
                  <span className="absolute right-0 top-[5%] rounded-full bg-[#a6e00c] px-4 py-2 text-[15px] font-bold text-[#2d3d00] shadow-[0px_4px_12px_rgba(166,224,12,0.45)] sm:text-[17px]">
                    {part.price}
                  </span>
                </div>
              ))}
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

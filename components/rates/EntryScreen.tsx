"use client";

import Image from "next/image";
import { OptionCard } from "./OptionCard";
import type { RateFlowKey } from "./types";

const ENTRY_INTRO = "Hello! I'm Camo. Your customer support chameleon!";
const ENTRY_QUESTION = "Do you already have a Kanopi account?";

const ENTRY_OPTIONS: { label: string; value: RateFlowKey }[] = [
  { label: "Yes", value: "yes-account" },
  { label: "Nope", value: "no-account" },
];

interface EntryScreenProps {
  selected: RateFlowKey | null;
  onSelect: (choice: RateFlowKey) => void;
}

/** Full-viewport entry screen — "Do you already have a Kanopi account?" */
export function EntryScreen({ selected, onSelect }: EntryScreenProps) {
  return (
    <section
      id="rates-entry"
      className="relative flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      {/* Header: logo left. The Camo avatar is a SIBLING (not a header child)
          positioned against the whole section — per Figma it straddles the
          header/body seam (roughly half overlapping the header, half
          hanging below it into the body), which a header-centered image
          can't do since it'd render almost entirely inside the header. */}
      <header className="sticky top-0 z-30 flex h-[98px] items-center bg-[#fff9f1] px-10 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Kanopi" className="h-[44px] w-auto" />
      </header>
      <Image
        src="/images/camo-avatar.png"
        alt="Camo, your customer support chameleon"
        width={101}
        height={101}
        className="absolute left-1/2 top-[47px] z-40 size-[101px] -translate-x-1/2 rounded-full object-cover"
      />

      {/* Centred question + choices */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="max-w-[941px] text-[20px] text-[rgba(45,61,0,0.5)] sm:text-[32px]">
          {ENTRY_INTRO}
        </p>
        <h2 className="mb-9 max-w-[941px] text-[32px] font-bold leading-tight text-[#2d3d00] sm:text-[52px]">
          {ENTRY_QUESTION}
        </h2>
        <div
          role="radiogroup"
          aria-label="Do you have a Kanopi account?"
          className="flex flex-col gap-4"
        >
          {ENTRY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={selected === opt.value}
              onSelect={() => onSelect(opt.value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

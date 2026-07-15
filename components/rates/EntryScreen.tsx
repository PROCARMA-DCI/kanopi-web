"use client";

import { OptionCard } from "./OptionCard";
import type { RateFlowKey } from "./types";

const ENTRY_QUESTION = "Hello! I'm Gaia.\nDo you already have a Kanopi account?";

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
      className="flex min-h-[100dvh] w-full snap-start snap-always flex-col bg-[#fff9f1]"
    >
      {/* Header: logo left, Gaia avatar centred */}
      <header className="sticky top-0 z-30 flex h-[98px] items-center bg-[#fff9f1] px-10 shadow-[0px_4px_20px_0px_rgba(129,74,0,0.1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.svg" alt="Kanopi" className="h-[44px] w-auto" />
        <span className="absolute left-1/2 top-1/2 flex size-[90px] -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[34px] font-bold text-[#2d3d00] shadow-[0px_6px_18px_rgba(129,74,0,0.12)]">
          G
        </span>
      </header>

      {/* Centred question + choices */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12 px-6 text-center">
        <h2 className="max-w-[941px] whitespace-pre-line text-[32px] font-bold leading-tight text-[#2d3d00] sm:text-[52px]">
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

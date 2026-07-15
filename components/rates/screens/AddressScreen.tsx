"use client";

import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { AddressMap, type PlaceResult } from "../AddressMap";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/** No-account · Address — map + Google Places address + apt/unit. */
export function AddressScreen({ index }: { index: number }) {
  const flow = useFlow();
  const firstName = (flow.data.firstName as string)?.trim() || "there";

  const [address, setAddress] = useState("");
  const [apt, setApt] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const completion = address.trim() !== "" ? 1 : 0;
  const canAdvance = completion === 1;

  const handlePlace = useCallback((place: PlaceResult) => {
    setAddress(place.address);
    setCoords({ lat: place.lat, lng: place.lng });
  }, []);

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Address"
      question={`Great to meet you ${firstName}. What's your Home address?`}
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={() => flow.next(index, { address, apt, coords })}
      onBack={() => flow.back(index)}
    >
      <div className="flex flex-col gap-4">
        <AddressMap inputRef={addressInputRef} onPlaceSelected={handlePlace} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Street address (3/4) — floating label + Places-autocomplete input */}
          <div className="flex h-[79px] flex-col justify-center rounded-2xl border border-[#7d8760] bg-[#fff9f1] px-5 sm:col-span-3">
            <span className="text-[13px] leading-none text-[#7d8760]">
              Street address, city, state
            </span>
            <input
              ref={addressInputRef}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="311 Magnolia Ave, Fairhope, AL 36532, USA"
              className="mt-1 w-full bg-transparent text-[18px] text-[#2d3d00] outline-none placeholder:text-[#7d8760]"
            />
          </div>

          {/* Apt / Unit (1/4) */}
          <Input
            className="sm:col-span-1"
            placeholder="Apt/Unit #"
            value={apt}
            onChange={(e) => setApt(e.target.value)}
          />
        </div>
      </div>
    </ScreenShell>
  );
}

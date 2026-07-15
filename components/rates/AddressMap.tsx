"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/googleMaps";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Default view until a place is chosen (Fairhope, AL — matches the design).
const DEFAULT_CENTER = { lat: 30.5225, lng: -87.9036 };

export interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
}

interface AddressMapProps {
  /** The address <input> to attach Google Places autocomplete to. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Called when the user picks a suggestion. */
  onPlaceSelected: (place: PlaceResult) => void;
  className?: string;
}

/**
 * Google map with a green Kanopi pin + Places autocomplete bound to the given
 * address input. If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` isn't set yet, it renders
 * a styled placeholder so the layout is complete and the input still works as
 * plain text.
 */
export function AddressMap({ inputRef, onPlaceSelected, className }: AddressMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Keep the latest callback without re-initialising the map.
  const cbRef = useRef(onPlaceSelected);
  cbRef.current = onPlaceSelected;

  useEffect(() => {
    if (!API_KEY || !mapRef.current) return;
    let cancelled = false;
    let google: any;
    let autocomplete: any;

    loadGoogleMaps(API_KEY)
      .then((g: any) => {
        google = g;
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: 14,
          disableDefaultUI: true,
          clickableIcons: false,
        });
        const marker = new google.maps.Marker({
          map,
          position: DEFAULT_CENTER,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: "#a6e00c",
            fillOpacity: 1,
            strokeColor: "#2d3d00",
            strokeWeight: 2,
          },
        });

        const input = inputRef.current;
        if (input && google.maps.places) {
          autocomplete = new google.maps.places.Autocomplete(input, {
            fields: ["formatted_address", "geometry"],
            types: ["address"],
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const loc = place.geometry?.location;
            if (!loc) return;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            map.setCenter(pos);
            map.setZoom(16);
            marker.setPosition(pos);
            cbRef.current({ address: place.formatted_address ?? "", ...pos });
          });
        }
      })
      .catch(() => {
        /* leave the placeholder / plain input in place */
      });

    return () => {
      cancelled = true;
      if (google && autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [inputRef]);

  return (
    <div
      className={cn(
        "relative h-[314px] w-full overflow-hidden rounded-2xl border border-[rgba(125,135,96,0.3)]",
        className,
      )}
    >
      {API_KEY ? (
        <div ref={mapRef} className="size-full" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#e9f4cf] to-[#dfe7d2] text-center text-[#7d8760]">
          <svg
            viewBox="0 0 24 24"
            className="size-10 text-[#a6e00c]"
            fill="currentColor"
          >
            <path
              stroke="#2d3d00"
              strokeWidth="1.5"
              d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
            />
          </svg>
          <p className="max-w-[280px] text-[13px]">
            Map preview — set{" "}
            <code className="rounded bg-white/60 px-1">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{" "}
            to enable the live map.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { fetching } from "@/lib/api/client";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

interface VinDecodeResult {
  make?: string;
  model?: string;
  year?: string | number;
}

/** What VehicleScreen gets back once a VIN resolves to a real make/model. */
export interface VinDecodedVehicle {
  make?: string;
  model?: string;
  year?: string;
}

// VIN barcodes can include leading/trailing separators; keep only the 17
// valid VIN characters (VINs never contain I, O or Q).
function sanitizeVin(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const match = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
  return match ? match[0] : cleaned;
}

/**
 * VIN input — type it manually, paste it, or scan the barcode with the
 * camera icon inside the field. Either path (blur / Enter / scan) runs the
 * same decode: hit /api/vindecode, match the returned make/model against the
 * makes/models this project already knows about, and hand the resolved
 * names up via `onDecoded` so VehicleScreen can fill its Make/Model/Year
 * selects.
 */
export default function VinQrCodeRead({
  vin,
  setVin,
  onDecoded,
}: {
  vin: string;
  setVin: (v: string) => void;
  onDecoded: (result: VinDecodedVehicle) => void;
}) {
  const { fetchModelAgainstMake, makes } = useLayout();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [vinError, setVinError] = useState("");

  const handleVinCode = async (value: string) => {
    setVinError("");

    const res = await fetching<VinDecodeResult>({
      url: "/api/vindecode",
      method: "GET",
      body: { vin: value },
      badgeLoading: "Vin decoding",
    });
    const decoded = res.message;
    if (!res.ok || !decoded) {
      setVinError(
        "Couldn't decode that VIN — you can still fill in the fields below.",
      );
      return;
    }

    const matchedMake = makes.find(
      (m) => m.name.toLowerCase() === decoded.make?.toLowerCase(),
    );
    if (!matchedMake) {
      setVinError("Make not found for that VIN — you are selecting manually.");
      onDecoded({ year: decoded.year ? String(decoded.year) : undefined });
      return;
    }

    const newModels = await fetchModelAgainstMake(matchedMake.id);
    const matchedModel = newModels?.find(
      (m) =>
        m.ModelName.toLowerCase().trim() ===
        decoded.model?.toLowerCase().trim(),
    );

    onDecoded({
      make: matchedMake.name,
      model: matchedModel?.ModelName,
      year: decoded.year ? String(decoded.year) : undefined,
    });
  };

  const handleVinBlur = () => {
    if (vin.trim().length === 17) handleVinCode(vin.trim());
  };

  useEffect(() => {
    if (!scannerOpen || !videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result, err) => {
          if (result) {
            const scanned = sanitizeVin(result.getText());
            setScannerOpen(false);
            setVin(scanned);
            handleVinCode(scanned);
          } else if (err && !(err instanceof NotFoundException)) {
            console.error(err);
          }
        },
      )
      .catch((err) => {
        console.error(err);
        setVinError("Unable to access camera for scanning.");
        setScannerOpen(false);
      });

    return () => {
      codeReader.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  return (
    <div className="relative col-span-2">
      {/* Figma: VIN input + a separate labeled "Scan VIN" button side by
          side on their own row — not an icon tucked inside the input. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_172px]">
        <Input
          placeholder="Enter VIN #"
          maxLength={17}
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          onBlur={handleVinBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (vin.trim()) handleVinCode(vin.trim());
            }
          }}
        />

        <button
          type="button"
          onClick={() => {
            setVinError("");
            setScannerOpen(true);
          }}
          className="flex h-[79px] cursor-pointer items-center justify-between rounded-2xl border-[1.5px] border-[rgba(125,135,96,0.5)] bg-[#bec0a9] px-5 text-[20px] font-bold text-white transition-colors hover:bg-[#aeb096]"
        >
          Scan VIN
          {/* Scan / barcode icon (inline SVG — no icon package installed) */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <path d="M7 8v8" />
            <path d="M11 8v8" />
            <path d="M14 8v8" />
            <path d="M18 8v8" />
          </svg>
        </button>
      </div>
      {vinError && (
        <p className="mt-1 text-[13px] text-yellow-600">{vinError}</p>
      )}

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-6">
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full max-w-130 rounded-2xl bg-black"
            muted
            playsInline
          />
          <p className="text-[15px] text-white/80">
            Point the camera at your VIN barcode.
          </p>
          <button
            type="button"
            onClick={() => setScannerOpen(false)}
            className="h-12.75 rounded-xl border-2 border-[#a6e00c] bg-[#a6e00c] px-8 text-[15px] font-bold text-[#2d3d00]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

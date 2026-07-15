"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  /** Small label above the pad. */
  label?: string;
  /** Controlled value (a data-URL PNG). */
  value?: string;
  /** Fires with the PNG data-URL as the user draws ("" when cleared). */
  onChange?: (dataUrl: string) => void;
  className?: string;
  /** Change this to programmatically clear the pad (e.g. on flow restart). */
  resetKey?: unknown;
}

type DrawEvent =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

/**
 * Canvas signature pad with undo / redo / clear.
 *
 * Converted to TSX from a plain-JS component and adapted to this project:
 * no external UI/icon libraries — inline SVG icons + Kanopi styling.
 */
export function SignaturePad({
  label = "Draw Signature",
  value,
  onChange,
  className,
  resetKey,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<string[]>([]);
  const blankImageRef = useRef("");
  const stepRef = useRef(-1);
  const didMountRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);

  const syncStep = (step: number) => {
    stepRef.current = step;
    setCurrentStep(step);
    setHistoryCount(historyRef.current.length);
  };

  const getCanvasImage = () => canvasRef.current?.toDataURL("image/png") ?? "";

  const applyCanvasDefaults = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#2d3d00";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const fillCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyCanvasDefaults();
  };

  const resetCanvas = () => {
    fillCanvas();
    const blankImage = getCanvasImage();
    blankImageRef.current = blankImage;
    historyRef.current = blankImage ? [blankImage] : [];
    syncStep(blankImage ? 0 : -1);
  };

  const saveToHistory = () => {
    const imageData = getCanvasImage();
    if (!imageData) return;
    const nextHistory = historyRef.current.slice(0, stepRef.current + 1);
    nextHistory.push(imageData);
    historyRef.current = nextHistory;
    syncStep(nextHistory.length - 1);
    onChange?.(imageData);
  };

  const restoreFromHistory = (step: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const imageData = historyRef.current[step];
    if (!canvas || !ctx || !imageData) return;
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      applyCanvasDefaults();
    };
    syncStep(step);
    onChange?.(imageData === blankImageRef.current ? "" : imageData);
  };

  // Initialise the canvas at its rendered size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    fillCanvas();

    const initialImage = value || getCanvasImage();
    blankImageRef.current = getCanvasImage();
    historyRef.current = initialImage ? [initialImage] : [];
    syncStep(initialImage ? 0 : -1);
    if (value) restoreFromHistory(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear when the caller bumps resetKey (skip the first render).
  useEffect(() => {
    if (resetKey === undefined) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    resetCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const getPoint = (e: DrawEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const startDrawing = (e: DrawEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    applyCanvasDefaults();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: DrawEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };

  const handleUndo = () => currentStep > 0 && restoreFromHistory(currentStep - 1);
  const handleRedo = () =>
    currentStep < historyCount - 1 && restoreFromHistory(currentStep + 1);
  const handleClear = () => {
    resetCanvas();
    onChange?.("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-[13px] text-[#7d8760]">{label}</span>

      <div className="flex overflow-hidden rounded-2xl border border-[rgba(125,135,96,0.5)] bg-[#fff9f1]">
        {/* Toolbar */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-[rgba(125,135,96,0.5)] bg-[rgba(125,135,96,0.08)] p-1.5">
          <ToolButton onClick={handleUndo} disabled={currentStep <= 0} label="Undo">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
          </ToolButton>
          <ToolButton
            onClick={handleRedo}
            disabled={currentStep >= historyCount - 1}
            label="Redo"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0 0 10h1" />
          </ToolButton>
          <ToolButton onClick={handleClear} label="Clear" danger>
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </ToolButton>
        </div>

        <canvas
          ref={canvasRef}
          className="h-32 min-w-0 flex-1 cursor-crosshair touch-none bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  disabled,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-30",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-[#2d3d00] hover:bg-[rgba(125,135,96,0.15)]",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

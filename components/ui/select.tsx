"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export interface SelectProps {
  placeholder?: string;
  options: string[];
  value: string;
  /** Called with the chosen option string. */
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Custom dropdown that ALWAYS opens downward (unlike a native <select>, which
 * the browser may flip upward). Fully stylable, keyboard accessible, and
 * closes on outside-click / Escape.
 */
export function Select({
  placeholder = "Select",
  options,
  value,
  onChange,
  className,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted option scrolled into view (arrow-key nav on long
  // lists). This effect only touches the DOM (scroll) — no setState — so it
  // doesn't trigger cascading renders.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    (
      listRef.current?.children[activeIndex] as HTMLElement | undefined
    )?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Open the menu AND highlight the current value in one go — done here in the
  // event handler rather than in an effect, so there's no setState-in-effect.
  const openMenu = () => {
    setActiveIndex(options.indexOf(value));
    setOpen(true);
  };
  const toggle = () => (open ? setOpen(false) : openMenu());

  const choose = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Escape":
        setOpen(false);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && activeIndex >= 0) choose(options[activeIndex]);
        else toggle();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-[79px] w-full items-center justify-between rounded-2xl border bg-[#fff9f1] px-5 text-[20px] outline-none transition-[border-color,box-shadow] duration-200",
          open
            ? "border-[#a6e00c] shadow-[0px_2px_10px_rgba(166,224,12,0.25)]"
            : "border-[rgba(125,135,96,0.5)]",
          value ? "text-[#2d3d00]" : "text-[#7d8760]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "size-5 shrink-0 text-[#7d8760] transition-transform duration-200",
            open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-64 w-full origin-top animate-[rate-dropdown_0.15s_ease-out] overflow-y-auto rounded-2xl border border-[rgba(125,135,96,0.4)] bg-[#fffaf3] p-1.5 shadow-[0px_12px_30px_rgba(129,74,0,0.18)]"
        >
          {options.map((opt, i) => {
            const selected = opt === value;
            const active = i === activeIndex;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(opt)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-[18px] transition-colors",
                  active && "bg-[#a6e00c]/20",
                  selected ? "font-bold text-[#2d3d00]" : "text-[#545e5e]",
                )}
              >
                {opt}
                {selected && (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-[#a6e00c]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

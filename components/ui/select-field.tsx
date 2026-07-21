"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectFieldProps {
  placeholder?: string;
  options: string[];
  value: string;
  /** Called with the chosen option string. */
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Simple `options: string[]` wrapper around the shadcn/Radix <Select>
 * primitives in `ui/select.tsx` — same call shape the rest of the app
 * already used (VehicleScreen, SignupScreen, …), so a screen just does
 * `<SelectField placeholder="Make" options={makeOptions} value={make}
 * onChange={setMake} />` instead of composing Select/SelectTrigger/
 * SelectContent/SelectItem by hand every time.
 */
export function SelectField({
  placeholder = "Select",
  options,
  value,
  onChange,
  className,
  disabled,
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

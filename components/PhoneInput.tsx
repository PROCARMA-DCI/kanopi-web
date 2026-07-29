import { cn } from "@/lib/utils";
import React, { useCallback } from "react";
import { Input } from "./ui/input";

interface InputProps {
  placeholder?: string;
  props?: React.InputHTMLAttributes<HTMLInputElement>;
  value?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: HTMLInputElement;
  onChange: (value: string) => void;
}
const PhoneInput = ({
  value,
  onBlur,
  placeholder,
  className,
  onChange,

  ...props
}: InputProps) => {
  // 👇 Memoize the format function
  const formatPhoneNumber = useCallback(
    (value: string | undefined | null): string => {
      if (!value) return "";

      const digits = String(value).replace(/\D/g, "").slice(0, 10);

      if (digits.length > 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length > 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      }
      return digits;
    },
    [],
  );
  return (
    <Input
      type="tel"
      placeholder={placeholder || "123-456-7890"}
      value={formatPhoneNumber(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        return onChange(digits);
      }}
      onBlur={onBlur}
      className={cn(``, className)}
      {...props}
    />
  );
};

export default PhoneInput;

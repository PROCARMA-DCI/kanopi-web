"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fetching } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { maskEmail, maskPhone } from "@/utils/helpers";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

type SendVia = "sms" | "email";

/** One masked destination card (Figma 379:155) — label above, value inside. */
function MaskedOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[12px] font-bold text-[rgba(45,61,0,0.5)]">
        {label}
      </span>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={cn(
          "flex h-[79px] w-[279px] cursor-pointer items-center justify-center rounded-2xl border-[1.5px] px-5 text-[20px] font-bold transition-all duration-200",
          selected
            ? "border-[#a6e00c] bg-[#fffaf3] text-[#2d3d00] shadow-[0px_2px_10px_rgba(166,224,12,0.3)]"
            : "border-[rgba(125,135,96,0.5)] bg-[#fff9f1] text-[rgba(125,135,96,0.5)] hover:border-[#a6e00c]/60",
        )}
      >
        {value}
      </button>
    </div>
  );
}

/** No-account · 2FA setup — choose phone or email, then send the OTP. */
export function TwoFactorScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [sendVia, setSendVia] = useState<SendVia | null>(null);

  const email = flow.data.email as string | undefined;
  const phone = flow.data.phone as string | undefined;
  const canAdvance = sendVia !== null;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Info"
      question="To make your account more secure, let's set up 2fa with either your phone or email. Please select an option below."
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={async () => {
        const res = await fetching({
          url: "/api/sendSignupOTP",
          method: "POST",
          isFormdata: true,
          body: { send_via: sendVia, email, phone },
          badgeLoading: "Sending verification code",
        });
        if (res.success) {
          flow.next(index, { sendVia });
        } else {
          toast.error((res?.message as string) ?? "Something went wrong", {
            className: "!bg-red-600 !text-white border-red-500 rounded-2xl",
          });
        }
      }}
      onBack={() => flow.back(index)}
    >
      <div
        role="radiogroup"
        aria-label="Send the verification code via"
        className="flex flex-wrap items-start justify-center gap-6"
      >
        <MaskedOption
          label="email"
          value={email ? maskEmail(email) : "—"}
          selected={sendVia === "email"}
          onSelect={() => setSendVia("email")}
        />
        <MaskedOption
          label="phone"
          value={phone ? maskPhone(phone) : "—"}
          selected={sendVia === "sms"}
          onSelect={() => setSendVia("sms")}
        />
      </div>
    </ScreenShell>
  );
}

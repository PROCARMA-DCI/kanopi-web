"use client";

import { useLoader } from "@/app/providers/LoaderContext";
import { useScroll } from "@/app/ScrollProvider";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { fetching } from "@/lib/api/client";
import { useState } from "react";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

const OTP_LENGTH = 5;

/**
 * No-account · OTP verification (Figma 382:49) — sent via whichever channel
 * was chosen on TwoFactorScreen. The message/label/code boxes/Next/resend
 * all live inside one bordered card per the design, so `onNext` is NOT
 * passed to ScreenShell (it would render its own separate Next button
 * outside the card) — this screen's own button inside the card calls the
 * same submit logic instead. Back stays as ScreenShell's own footer button
 * below the card.
 *
 * Just verifies the code — PaymentScreen (rendered next) owns Stripe setup.
 *
 * NOTE: the verify endpoint name/params below are a placeholder
 * (`/api/verifySignupOTP`, `{otp, send_via, email, phone}`) — swap in the
 * real contract once it's confirmed.
 */
export function OtpScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { setLoading, loading } = useLoader();
  const { scrollTo } = useScroll();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const sendVia = flow.data.sendVia as "sms" | "email" | undefined;
  const email = flow.data.email as string | undefined;
  const phone = flow.data.phone as string | undefined;
  const destination = sendVia === "sms" ? phone : email;
  const contactLabel = sendVia === "sms" ? "number" : "email";

  const canAdvance = otp.length === OTP_LENGTH;

  const handleVerify = async () => {
    setError("");
    const res = await fetching({
      url: "/api/verifySignupOTP",
      method: "POST",
      isFormdata: true,
      body: { otp, send_via: sendVia, email, phone },
      setLoading,
    });

    if (!res.ok || res.success === 0) {
      setError("That code didn't work — please check it and try again.");
      return;
    }

    flow.next(index, { otpVerified: true });
  };

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Info"
      question="Almost there — let's verify your account."
      canAdvance={canAdvance}
    >
      <div className="mx-auto flex w-full max-w-full flex-col items-center gap-6 rounded-[36px] border-[1.5px] border-[rgba(125,135,96,0.5)] px-8 py-8">
        <p className="text-center text-[16px] text-[#7d8760]">
          We just sent a {OTP_LENGTH}-digit code to {destination ?? "you"},
          enter it below:
        </p>

        <div className="flex w-full flex-col items-center gap-2">
          <span className="text-[18px] font-bold text-[#2d3d00]">
            Enter Code
          </span>
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            containerClassName="w-full"
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <Button
          type="button"
          onClick={handleVerify}
          disabled={!canAdvance || loading}
          variant={canAdvance ? "primary" : "muted"}
          className="w-full cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Verifying…" : "Next"}
        </Button>

        <p className="text-[15px] text-[#7d8760]">
          Wrong {contactLabel}?{" "}
          <button
            type="button"
            // Index 0 = CreateAccountScreen, where email/phone are
            // collected in NoAccountFlow — this component already only
            // makes sense inside that flow (see StripeCheckoutCard's
            // "Edit my info" for the same pattern).
            onClick={() => scrollTo(flow.stepId(0))}
            className="cursor-pointer font-bold text-[#2d3d00] underline"
          >
            Send to different {contactLabel}
          </button>
        </p>
      </div>
    </ScreenShell>
  );
}

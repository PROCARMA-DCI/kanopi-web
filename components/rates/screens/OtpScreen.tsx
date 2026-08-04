"use client";

import { useLoader } from "@/app/providers/LoaderContext";
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
 * No-account · OTP verification — sent via whichever channel was chosen on
 * TwoFactorScreen. No Figma mock for this exact screen yet; matches the
 * surrounding screens' layout (ScreenShell + Camo question) with a shadcn
 * `<InputOTP>` for the code itself, per request.
 *
 * Just verifies the code — PaymentScreen (rendered next) owns Stripe setup.
 *
 * NOTE: the verify endpoint name/params below are a placeholder
 * (`/api/verifySignupOTP`, `{otp, send_via, email, phone}`) — swap in the
 * real contract once it's confirmed.
 */
export function OtpScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { setLoading } = useLoader();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const sendVia = flow.data.sendVia as "sms" | "email" | undefined;
  const email = flow.data.email as string | undefined;
  const phone = flow.data.phone as string | undefined;
  const destination = sendVia === "sms" ? phone : email;

  const canAdvance = otp.length === OTP_LENGTH;

  const handleResend = async () => {
    setResending(true);
    setOtp("");
    setError("");
    await fetching({
      url: "/api/sendSignupOTP",
      method: "POST",
      isFormdata: true,
      body: { send_via: sendVia, email, phone },
    });
    setResending(false);
  };

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={canAdvance ? 1 : 0}
      title="Your Info"
      question={`We sent a ${OTP_LENGTH}-digit code to ${destination ?? "you"}. Enter it below to verify your account.`}
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={async () => {
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
      }}
      onBack={() => flow.back(index)}
    >
      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="cursor-pointer text-[15px] font-semibold text-[#7d8760] underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Resending…" : "Didn't get a code? Resend"}
        </button>
      </div>
    </ScreenShell>
  );
}

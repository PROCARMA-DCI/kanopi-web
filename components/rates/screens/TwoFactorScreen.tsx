"use client";

import { useState } from "react";
import { useLoader } from "@/app/providers/LoaderContext";
import { fetching } from "@/lib/api/client";
import { OptionCard } from "../OptionCard";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

type SendVia = "phone" | "email";

/** No-account · 2FA setup — choose phone or email, then send the OTP. */
export function TwoFactorScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { setLoading } = useLoader();
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
      question="To make your account more secure, let's set up 2FA with either your phone or email. Please select an option below."
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={async () => {
        await fetching({
          url: "/api/sendSignupOTP",
          method: "POST",
          isFormdata: true,
          body: { send_via: sendVia, email, phone },
          setLoading,
        });
        flow.next(index, { sendVia });
      }}
      onBack={() => flow.back(index)}
    >
      <div
        role="radiogroup"
        aria-label="Send the verification code via"
        className="flex flex-col items-center gap-4"
      >
        <OptionCard
          label="Phone"
          selected={sendVia === "phone"}
          onSelect={() => setSendVia("phone")}
        />
        <OptionCard
          label="Email"
          selected={sendVia === "email"}
          onSelect={() => setSendVia("email")}
        />
      </div>
    </ScreenShell>
  );
}

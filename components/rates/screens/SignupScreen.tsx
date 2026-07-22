"use client";

import { useLoader } from "@/app/providers/LoaderContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { fetching } from "@/lib/api/client";
import { useState } from "react";
import { states } from "../data/vehicle";
import { SignaturePad } from "../SignaturePad";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/**
 * No-account · "Your Info" (Figma KANOPI-NO-ACCOUNT-02) — address, password,
 * agreements and signature. Name/email/phone were moved to the earlier
 * CreateAccountScreen step, so they're read from `flow.data` here, not
 * re-collected.
 */
export function SignupScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { setLoading } = useLoader();
  const [streetAddress, setStreetAddress] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeVsc, setAgreeVsc] = useState(false);
  const [agreeSms, setAgreeSms] = useState(false);
  const [agreeEmail, setAgreeEmail] = useState(false);
  const [signature, setSignature] = useState("");

  const passwordMatch = password !== "" && password === confirmPassword;

  const requirements = [
    streetAddress.trim() !== "",
    city.trim() !== "",
    state.trim() !== "",
    passwordMatch,
    agreeVsc, // consent to terms is required
    signature !== "",
  ];
  const completion = requirements.filter(Boolean).length / requirements.length;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      completion={completion}
      title="Your Info"
      question="Almost done! I just need a few more pieces of info to finalize your account."
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={async () => {
        // Check whether this vehicle's VIN already has a contract on file —
        // ExistingPlanScreen (rendered by NoAccountFlow) reads
        // `contractCheck` off flow.data to decide what to show next.
        const res = await fetching({
          url: "/api/checkVinWithDetail",
          method: "POST",
          isFormdata: true,
          body: { email: flow.data.email as string, vin: flow.data.vin as string },
          setLoading,
        });

        flow.next(index, {
          streetAddress,
          apt,
          city,
          state,
          password,
          agreeVsc,
          agreeSms,
          agreeEmail,
          signature,
          contractCheck: res,
        });
      }}
      onBack={() => flow.back(index)}
    >
      <div className="flex flex-col gap-6">
        {/* Street 3/4, Apt 1/4; City + State split the next row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Input
            className="sm:col-span-3"
            type="text"
            placeholder="Street address"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
          />
          <Input
            className="sm:col-span-1"
            type="text"
            placeholder="Apt/Unit #"
            value={apt}
            onChange={(e) => setApt(e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <SelectField
            className="sm:col-span-2"
            placeholder="Select State"
            options={states}
            value={state}
            onChange={setState}
          />
          <Input
            className="sm:col-span-2"
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Inline mismatch hint */}
        {confirmPassword !== "" && !passwordMatch && (
          <p className="-mt-2 text-[13px] text-red-600">
            Passwords don&apos;t match.
          </p>
        )}

        {/* Agreements */}
        <div className="flex flex-col gap-3">
          <Agreement checked={agreeVsc} onChange={setAgreeVsc}>
            I agree to the VSC terms and conditions.
          </Agreement>
          <Agreement checked={agreeSms} onChange={setAgreeSms}>
            I agree to receive SMS messages about my service contract and
            updates.
          </Agreement>
          <Agreement checked={agreeEmail} onChange={setAgreeEmail}>
            I agree to receive email communications about my service contract
            and updates.
          </Agreement>
        </div>

        {/* Signature */}
        <SignaturePad value={signature} onChange={setSignature} />

        {/* Legal consent */}
        <p className="text-[12px] leading-[18px] text-[#7d8760]">
          By clicking the button, you agree to Procarma utilizing automated
          technology to contact you via phone, email, and text using the
          provided contact information, including your wireless number if
          provided, for matters related to maintenance, auto protection or, in
          California, mechanical breakdown insurance. You also acknowledge and
          accept the Procarma{" "}
          <a
            href="https://mypcp.us/term-condition"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://mypcp.us/term-condition"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Terms and Conditions
          </a>
          . Your consent is not required for making a purchase, and you retain
          the right to withdraw your consent at any time. Standard message and
          data rates may apply.
        </p>
      </div>
    </ScreenShell>
  );
}

function Agreement({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="text-[13px] text-[#2d3d00]">{children}</span>
    </label>
  );
}

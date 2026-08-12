"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { fetching } from "@/lib/api/client";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { planType } from "../data/coverages";
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
  const { states, fetchStates, DealerID } = useLayout();
  const [streetAddress, setStreetAddress] = useState("");
  const [apt, setApt] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  // The state SELECT displays/stores the code (e.g. "AL") like before —
  // stateId (looked up below) is the actual value that gets saved, per
  // /api/stateList's { StateID, StateTitle, StateCode } rows.
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeVsc, setAgreeVsc] = useState(false);
  const [agreeSms, setAgreeSms] = useState(false);
  const [agreeEmail, setAgreeEmail] = useState(false);
  const [signature, setSignature] = useState("");

  const stateOptions = states.map((s) => s.StateCode);
  const stateId = states.find((s) => s.StateCode === state)?.StateID ?? "";

  useEffect(() => {
    if (states.length === 0) fetchStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [zipError, setZipError] = useState("");

  // Fires on blur (tab away or click elsewhere) — not on every keystroke,
  // since a zip isn't worth validating until the customer's done typing it.
  // The response's own city/state_abbreviation auto-fill those fields too,
  // matching what a customer would expect ("I typed my zip, why do I still
  // have to type my city").
  const checkZip = async () => {
    if (zip.trim() === "") return;

    const res = await fetching<{
      is_us_zip?: number;
      city?: string;
      state_abbreviation?: string;
    }>({
      url: "/api/checkUSZipCode",
      isFormdata: true,
      method: "POST",
      body: { zip_code: zip },
      badgeLoading: "Checking ZIP",
    });

    if (!res.ok || !res.success || !res.is_us_zip) {
      setZipError(
        (res.message as string) || "Please enter a valid US zip code.",
      );
      return;
    }

    setZipError("");
    if (res.city) setCity(res.city as string);
    if (res.state_abbreviation) setState(res.state_abbreviation as string);
  };

  const passwordMatch = password !== "" && password === confirmPassword;

  const requirements = [
    streetAddress.trim() !== "",
    zip.trim() !== "" && !zipError,
    city.trim() !== "",
    state.trim() !== "",
    passwordMatch,
    agreeVsc, // consent to terms is required
    signature !== "",
  ];
  const completion = requirements.filter(Boolean).length / requirements.length;
  const canAdvance = completion === 1;

  // Keep flow.data live as fields change — not just on Next click. Without
  // this, editing a field here AFTER already clicking Next once (e.g. the
  // customer scrolls back from Payment to fix a wrong zip) silently has no
  // effect unless they click Next again, which read as a bug ("I edited
  // it but it didn't work").
  useEffect(() => {
    flow.patch({
      streetAddress,
      apt,
      zip,
      city,
      state_id: stateId,
      password,
      agreeVsc,
      agreeSms,
      agreeEmail,
      signature,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    streetAddress,
    apt,
    zip,
    city,
    stateId,
    password,
    agreeVsc,
    agreeSms,
    agreeEmail,
    signature,
  ]);

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
        // Both calls run concurrently, but flow.next (below) must wait for
        // BOTH to resolve — awaiting them together (not fire-and-forget)
        // avoids a race where `coverages` is read before its fetch settles.
        const [coveragesRes, existingPlanRes] = await Promise.all([
          fetching<{ message?: planType[] }>({
            url: "/api/kanopiPlansList",
            method: "POST",
            isFormdata: true,
            body: {
              dealer_id: 4, //DealerID,
              postal_code: zip,
              state_province: stateId,
              vehicle_mileage: (flow.data.mileage as string) ?? "",
              vin_number: (flow.data.vin as string) ?? "",
            },
            badgeLoading: "Coverages Checking",
          }),
          // CoverageScreen (rendered next) reads `existingPlan` off flow.data
          // to show any plan(s) already on file above the purchasable list.
          fetching<Record<string, unknown>[]>({
            url: "/api/checkAlreadyPurchasedPlanForEmail",
            method: "POST",
            isFormdata: true,
            body: { email: flow.data.email as string },
            badgeLoading: "Checking Email",
          }),
        ]);

        // Both backends' "no results" shape isn't guaranteed to be an empty
        // array — checkAlreadyPurchasedPlanForEmail in particular has been
        // seen returning a plain string message instead. `.length > 0` is
        // true for a non-empty STRING too, so without Array.isArray() a
        // string message here would get stored as `existingPlan` and crash
        // CoverageScreen's `.map()` over it.
        const plans = coveragesRes.message;
        const coverages =
          coveragesRes.success && Array.isArray(plans) && plans.length
            ? (plans as planType[])
            : undefined;

        const existingPlan = Array.isArray(existingPlanRes?.message)
          ? existingPlanRes.message
          : null;

        flow.next(index, {
          streetAddress,
          apt,
          zip,
          city,
          state_id: stateId,
          password,
          agreeVsc,
          agreeSms,
          agreeEmail,
          signature,
          existingPlan,
          coverages,
        });
      }}
      onBack={() => flow.back(index)}
    >
      <div className="flex flex-col gap-6">
        {/* Street 1/2, Apt + Zip 1/4 each; City + State split the next row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Input
            className="sm:col-span-2"
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
            className="sm:col-span-1"
            type="text"
            inputMode="numeric"
            placeholder="Zip"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/[^0-9]/g, ""));
              setZipError("");
            }}
            onBlur={checkZip}
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
            options={stateOptions}
            value={state}
            onChange={setState}
          />
          <div className="relative sm:col-span-2">
            <Input
              className="pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative sm:col-span-2">
            <Input
              className="pr-12"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Inline zip validation hint */}
        {zipError && (
          <p className="-mt-2 text-[13px] text-red-600">{zipError}</p>
        )}

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
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="cursor-pointer"
      />
      <span className="text-[13px] text-[#2d3d00]">{children}</span>
    </label>
  );
}

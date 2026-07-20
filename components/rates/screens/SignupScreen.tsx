"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { useState } from "react";
import { states } from "../data/vehicle";
import { SignaturePad } from "../SignaturePad";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/** No-account · About You — account details, agreements and signature. */
export function SignupScreen({ index }: { index: number }) {
  const flow = useFlow();
  const [firstName, setFirstName] = useState(flow.data.firstName as string);
  const [lastName, setLastName] = useState(flow.data.lastName as string);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeVsc, setAgreeVsc] = useState(false);
  const [agreeSms, setAgreeSms] = useState(false);
  const [agreeEmail, setAgreeEmail] = useState(false);
  const [signature, setSignature] = useState("");

  const emailMatch = email.trim() !== "" && email === confirmEmail;
  const passwordMatch = password !== "" && password === confirmPassword;

  const requirements = [
    firstName.trim() !== "",
    lastName.trim() !== "",
    emailMatch,
    passwordMatch,
    streetAddress.trim() !== "",
    city.trim() !== "",
    state.trim() !== "",
    phone.trim() !== "",
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
      title="About You"
      question="Awesome! Now let's get to know a little more about you."
      canAdvance={canAdvance}
      nextLabel={index === flow.total - 1 ? "See my rate" : "Next"}
      onNext={() =>
        flow.next(index, {
          firstName,
          lastName,
          email,
          streetAddress,
          apt,
          city,
          state,
          phone,
          agreeVsc,
          agreeSms,
          agreeEmail,
          signature,
        })
      }
      onBack={() => flow.back(index)}
    >
      <div className="flex flex-col gap-6">
        {/* Account + address fields on a 4-col grid so the street field can
            span 3/4 while Apt takes 1/4 (like the old Contact screen). */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Input
            className="sm:col-span-2"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            type="email"
            placeholder="Confirm Email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
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
          {/* Street 3/4, Apt 1/4 */}
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
          {/* City + State split the next row */}
          <Input
            className="sm:col-span-2"
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <SelectField
            className="sm:col-span-2"
            placeholder="State"
            options={states}
            value={state}
            onChange={setState}
          />
          <Input
            className="sm:col-span-2"
            type="tel"
            placeholder="Phone #"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Inline mismatch hints */}
        {confirmEmail !== "" && !emailMatch && (
          <p className="-mt-2 text-[13px] text-red-600">
            Emails don&apos;t match.
          </p>
        )}
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

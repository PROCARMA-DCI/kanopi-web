"use client";

import { useLayout } from "@/app/providers/LayoutContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";

/** No-account · Step 1 — name, email and phone (Figma KANOPI-NO-ACCOUNT-01). */
export function CreateAccountScreen({ index }: { index: number }) {
  const flow = useFlow();
  const { fetchMakes } = useLayout();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phone, setPhone] = useState("");

  const emailMatch = email.trim() !== "" && email === confirmEmail;
  const requirements = [
    firstName.trim() !== "",
    lastName.trim() !== "",
    emailMatch,
    phone.trim() !== "",
  ];
  const completion = requirements.filter(Boolean).length / requirements.length;
  const canAdvance = completion === 1;

  return (
    <ScreenShell
      id={flow.stepId(index)}
      index={index}
      total={flow.total}
      contentClassName="max-w-[767px]"
      completion={completion}
      title="Creating Your Account"
      question="Please provide your phone # and email so I can setup your safe and secure profile."
      canAdvance={canAdvance}
      onNext={() => {
        flow.next(index, { firstName, lastName, email, phone });
        fetchMakes();
      }}
      onBack={() => flow.back(index)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-[684px]  justify-center mx-auto">
        <Input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Confirm email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
        />
        <Input
          type="tel"
          placeholder="Phone #"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {confirmEmail !== "" && !emailMatch && (
        <p className="-mt-2 text-[13px] text-red-600">
          Emails don&apos;t match.
        </p>
      )}
    </ScreenShell>
  );
}

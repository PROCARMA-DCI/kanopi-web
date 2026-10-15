type FlowData = Record<string, unknown>;

/**
 * Snapshot of the contact info an OTP is tied to. Verification is only valid
 * while this stays identical — change the email OR phone (or the channel)
 * after verifying and the key no longer matches, so the customer has to
 * verify again.
 */
export function getContactKey(data: FlowData) {
  const { sendVia, email, phone } = data;
  if (!sendVia || !email || !phone) return "";
  return JSON.stringify([sendVia, email, phone]);
}

/** True only if the OTP was verified for the CURRENT email + phone + channel. */
export function isOtpVerified(data: FlowData) {
  const key = getContactKey(data);
  return key !== "" && data.otpVerifiedFor === key;
}

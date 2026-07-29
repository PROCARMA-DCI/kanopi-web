const MMDDYYYY_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

/**
 * Normalizes any of the date shapes we deal with (a Date, a timestamp like
 * `Date.now()`, an ISO string, or an already-formatted string) into
 * "MM/DD/YYYY" — the only format this backend accepts.
 */
export function formatDate(dateInput: Date | number | string): string {
  if (!dateInput) return "";

  if (typeof dateInput === "string" && MMDDYYYY_REGEX.test(dateInput)) {
    return dateInput;
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Masks an email for display (Figma's 2FA picker: "c************ma.com") —
 * keeps the first character and the last 6, stars out everything between.
 */
export function maskEmail(email: string): string {
  if (email.length <= 7) return email;
  const first = email[0];
  const last6 = email.slice(-6);
  const stars = "*".repeat(email.length - 7);
  return `${first}${stars}${last6}`;
}

/**
 * Masks a phone number for display (Figma's 2FA picker: "********08") —
 * stars out every digit except the last 2.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return "*".repeat(digits.length - 2) + digits.slice(-2);
}

/**
 * Post-login account data (returning member dashboard).
 * Static now, shaped like the API response to come.
 */

export interface Policy {
  id: string;
  vehicle: string;
  insured: string;
  coverageDates: string;
  policyNumber: string;
}

export interface AccountProfile {
  name: string;
  joined: string;
  planName: string;
  contract: string;
  deductible: number;
  planDates: string;
  policies: Policy[];
}

export const ACCOUNT: AccountProfile = {
  name: "Penelope Lawrence",
  joined: "Joined April 22, 2026",
  planName: "Powertrain Plus",
  contract: "Vehicle Service Contract",
  deductible: 100,
  planDates: "Dec 20, 2025 - Jun 20, 2026",
  policies: [
    {
      id: "p1",
      vehicle: "2025 Subaru Crosstrek",
      insured: "James Parrish, Mila Kaczmarczyk",
      coverageDates: "Dec 20, 2025 - Jun 20, 2026",
      policyNumber: "11085742655-JSDUY-2541",
    },
  ],
};

/** The four highlighted components on the dashboard. */
export const SUMMARY_COMPONENTS = [
  { key: "engine", label: "Engine" },
  { key: "transmission", label: "Transmission" },
  { key: "electrical", label: "Electrical" },
  { key: "chassis", label: "Chassis" },
] as const;

/** Full list shown in the "See all covered components" modal (API later). */
export const COVERED_COMPONENTS: { key: string; label: string }[] = [
  { key: "engine", label: "Engine" },
  { key: "transmission", label: "Transmission" },
  { key: "electrical", label: "Electrical" },
  { key: "chassis", label: "Chassis" },
  { key: "cooling", label: "Cooling System" },
  { key: "fuel", label: "Fuel System" },
  { key: "steering", label: "Steering" },
  { key: "brakes", label: "Brakes" },
  { key: "suspension", label: "Suspension" },
  { key: "ac", label: "Air Conditioning" },
  { key: "axle", label: "Drive Axle" },
  { key: "turbo", label: "Turbocharger" },
  { key: "gear", label: "Differential" },
  { key: "electrical", label: "Sensors" },
  { key: "engine", label: "Timing Belt" },
];

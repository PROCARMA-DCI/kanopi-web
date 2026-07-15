/**
 * Coverage options shown on the "Your Coverage" screen.
 *
 * STATIC placeholder data today, shaped like the API response to come. To go
 * live, replace `COVERAGES` with a fetch — the screen renders whatever length
 * the list is, so nothing else changes.
 */
export interface Coverage {
  id: string;
  /** Plan name, e.g. "Powertrain Plus". */
  name: string;
  /** Small line under the name, e.g. "Service Contract". */
  subtitle: string;
  /** Green highlight line, e.g. "3 Year or 36,000 Miles". */
  highlight: string;
  /** Deductible amount in USD. */
  deductible: number;
  /** "Your Price" total in USD. */
  price: number;
  /** Optional badge, e.g. "Most popular". */
  badge?: string;
}

export const COVERAGES: Coverage[] = [
  {
    id: "powertrain-plus",
    name: "Powertrain Plus",
    subtitle: "Service Contract",
    highlight: "3 Year or 36,000 Miles",
    deductible: 500,
    price: 1205,
  },
  {
    id: "preferred-care",
    name: "Preferred Care",
    subtitle: "Service Contract",
    highlight: "4 Year or 48,000 Miles",
    deductible: 250,
    price: 1650,
    badge: "Most popular",
  },
  {
    id: "premium-shield",
    name: "Premium Shield",
    subtitle: "Service Contract",
    highlight: "5 Year or 60,000 Miles",
    deductible: 100,
    price: 2090,
  },
];

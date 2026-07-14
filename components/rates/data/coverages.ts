/**
 * Coverage options shown on the "Your Coverage" screen.
 *
 * This is STATIC placeholder data today, shaped exactly like what the API will
 * return later. To go live, replace `COVERAGES` with a fetch (server component,
 * route handler, or SWR/React Query) — the screen already renders whatever
 * length the list is, so nothing else needs to change.
 */
export interface Coverage {
  id: string;
  name: string;
  /** Monthly price in USD. */
  price: number;
  /** e.g. "60 mo / 60k mi". */
  term: string;
  /** Short selling points shown on the card. */
  highlights: string[];
  /** Optional badge, e.g. "Most popular". */
  badge?: string;
}

export const COVERAGES: Coverage[] = [
  {
    id: "essential",
    name: "Essential",
    price: 39,
    term: "48 mo / 50k mi",
    highlights: ["Powertrain & engine", "24/7 roadside", "Nationwide repair network"],
  },
  {
    id: "preferred",
    name: "Preferred",
    price: 48,
    term: "60 mo / 60k mi",
    highlights: ["Everything in Essential", "Electrical & A/C", "Rental car reimbursement"],
    badge: "Most popular",
  },
  {
    id: "premium",
    name: "Premium",
    price: 62,
    term: "72 mo / 75k mi",
    highlights: ["Everything in Preferred", "Tires & wheels", "Trip interruption cover"],
  },
];

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

/**
 * One rate option as returned by getVehicleRates
 * (`data.NonCommercialVehicleRates[]`) — only the fields CoverageScreen
 * actually needs; the backend sends a lot more that we don't use.
 */
export interface VehicleRate {
  ReserveRateId: number;
  CoverageName: string;
  ProductName?: string;
  ProductTypeName?: string;
  TermMonths?: number;
  TermMiles?: number;
  Deductible?: number;
  MinimumRetail?: number | null;
  TotalAdminCost?: number;
  RateCost?: number;
}

/** Maps one getVehicleRates rate option onto the shape CoverageCard renders. */
export function mapVehicleRateToCoverage(rate: VehicleRate): Coverage {
  const years = rate.TermMonths ? Math.round(rate.TermMonths / 12) : null;
  const miles = rate.TermMiles?.toLocaleString("en-US");
  const highlight =
    years && miles ? `${years} Year or ${miles} Miles` : rate.ProductName ?? "";

  return {
    id: String(rate.ReserveRateId),
    name: rate.CoverageName,
    subtitle: rate.ProductTypeName ?? rate.ProductName ?? "Service Contract",
    highlight,
    deductible: rate.Deductible ?? 0,
    price: rate.MinimumRetail ?? rate.TotalAdminCost ?? rate.RateCost ?? 0,
  };
}

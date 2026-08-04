/**
 * Coverage options shown on the "Your Coverage" screen.
 *
 * STATIC placeholder data today, shaped like the API response to come. To go
 * live, replace `COVERAGES` with a fetch — the screen renders whatever length
 * the list is, so nothing else changes.
 */

export const DemoCoverages: planType[] = [
  {
    plan_id: "227190",
    title: "CCD Platinum",
    category: "Vehicle Service Contract",
    term: "4 Years or 75,000 Miles",
    deductible: 100,
    price: 1955,
    coverage_id: 3,
    product_id: 1,
    dealer_program_id: 11,
    reserve_rate_id: 1642,
  },
  {
    plan_id: "227191",
    title: "CCD Platinum",
    category: "Vehicle Service Contract",
    term: "3 Years or 75,000 Miles",
    deductible: 100,
    price: 1920,
    coverage_id: 3,
    product_id: 1,
    dealer_program_id: 11,
    reserve_rate_id: 1641,
  },
  {
    plan_id: "227190",
    title: "CCD Platinum",
    category: "Vehicle Service Contract",
    term: "4 Years or 75,000 Miles",
    deductible: 100,
    price: 1955,
    coverage_id: 3,
    product_id: 1,
    dealer_program_id: 11,
    reserve_rate_id: 1642,
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
export interface planType {
  plan_id: string;
  title: string;
  category: string;
  term: string;
  deductible: number;
  price: number;
  coverage_id: number;
  product_id: number;
  dealer_program_id: number;
  reserve_rate_id: number;
}

/** Maps one getVehicleRates rate option onto the shape CoverageCard renders. */
// export function mapVehicleRateToCoverage(rate: VehicleRate): planType {
//   const years = rate.TermMonths ? Math.round(rate.TermMonths / 12) : null;
//   const miles = rate.TermMiles?.toLocaleString("en-US");
//   const highlight =
//     years && miles
//       ? `${years} Year or ${miles} Miles`
//       : (rate.ProductName ?? "");

//   return {
//     id: String(rate.ReserveRateId),
//     name: rate.CoverageName,
//     subtitle: rate.ProductTypeName ?? rate.ProductName ?? "Service Contract",
//     highlight,
//     deductible: rate.Deductible ?? 0,
//     price: rate.MinimumRetail ?? rate.TotalAdminCost ?? rate.RateCost ?? 0,
//   };
// }

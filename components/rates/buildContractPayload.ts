import { formatDate } from "@/utils/helpers";
import type { planType } from "./data/coverages";

export interface ContractPayload {
  [key: string]: unknown;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  zip: string;
  address: string;
  state_id: string;
  city_name: string;
  unit_address?: string;
  dealer_id: number;
  make_id: string;
  model_id: string;
  year_id: string;
  vin: string;
  initial_mileage: string;
  password: string;
  plan_id: string;
  rate_id: number;
  coverage_price: number;
  payment_date: string;
}

/**
 * Builds the /kanopi/stage payload from the flow's collected data — the
 * one place this field mapping lives, since PaymentScreen (stages the
 * data before payment) and StripeCheckoutCard (used to post it directly)
 * both need the exact same shape.
 */
export function buildContractPayload(
  data: Record<string, unknown>,
  dealerId: number,
  selectedCoverage: planType | null,
): ContractPayload {
  return {
    first_name: (data.firstName as string) ?? "",
    last_name: (data.lastName as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    zip: (data.zip as string) ?? "",
    address: (data.streetAddress as string) ?? "",
    unit_address: (data.apt as string) ?? "",
    dealer_id: dealerId,
    make_id: (data.make as string) ?? "",
    model_id: (data.model as string) ?? "",
    year_id: (data.year as string) ?? "",
    vin: (data.vin as string) ?? "",
    initial_mileage: (data.mileage as string) ?? "",
    password: (data.password as string) ?? "",
    plan_id: selectedCoverage?.plan_id ?? "",
    rate_id: selectedCoverage?.reserve_rate_id ?? 0,
    coverage_price: selectedCoverage?.price ?? 0,
    state_id: (data.state_id as string) ?? "",
    city_name: (data.city as string) ?? "",
    payment_date: formatDate(new Date()),
  };
}

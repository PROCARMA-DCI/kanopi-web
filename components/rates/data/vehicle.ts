// A rolling list of recent model years (current year down to 25 years back).
// Kept as a plain constant so it's stable between server and client renders.

export function generateYearsArray() {
  const currentYear = new Date().getFullYear();
  const startYear = 1924;
  const yearsArray = [];

  for (let year = startYear; year <= currentYear; year++) {
    yearsArray.push(year);
  }

  return yearsArray;
}

export const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export interface CalcParams {
  units: number;
  pricePerUnit: number;
  commonCharges: number;
  propertyTaxes: number;
  propType: string;
  monthlyRent: number;
  otherCharges: number;
  rentTaxes: number;
  timelineYears: number;
  appreciation: number;
  rentGrowth: number;
  acqPct: number;
  dispPct: number;
  maintPct: number;
  rentBrkPct: number;
}

/** Display-value defaults (percentages as whole numbers, e.g. 2.5 = 2.5%) */
export const defaults = {
  units: 1,
  pricePerUnit: 2_000_000,
  commonCharges: 1_200,
  propertyTaxes: 1_000,
  propType: "residential",
  monthlyRent: 8_000,
  otherCharges: 0,
  rentTaxes: 0,
  timelineYears: 30,
  annualAppreciation: 2.5,
  annualRentGrowth: 2.75,
  acqPct: 2.0,
  dispPct: 7.5,
  maintPct: 5.0,
  rentBrkPct: 7.5,
} as const;

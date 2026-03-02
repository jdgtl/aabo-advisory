export interface CalcParams {
  units: number;
  pricePerUnit: number;
  commonCharges: number;
  propertyTaxes: number;
  propertyType: string;
  monthlyRent: number;
  otherCharges: number;
  rentTaxes: number;
  rentBrokerPct: number;
  timelineYears: number;
  annualAppreciation: number;
  annualRentGrowth: number;
  acquisitionCostPct: number;
  disposalCostPct: number;
  maintenancePct: number;
}

/** Display-value defaults (percentages as whole numbers, e.g. 2.5 = 2.5%) */
export const defaults = {
  units: 9,
  pricePerUnit: 2_000_000,
  commonCharges: 1_200,
  propertyTaxes: 1_000,
  propertyType: "condo",
  monthlyRent: 8_000,
  otherCharges: 0,
  rentTaxes: 0,
  rentBrokerPct: 7.5,
  timelineYears: 16,
  annualAppreciation: 2.5,
  annualRentGrowth: 2.75,
  acquisitionCostPct: 4.5,
  disposalCostPct: 6.5,
  maintenancePct: 5,
} as const;

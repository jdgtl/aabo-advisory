import type { CalcParams } from "./defaults";

/* ─── DEFAULT CONSTANTS (overridable via CalcParams) ─── */

export interface YearlyRow {
  year: number;
  buyAnnualCost: number;
  rentAnnualCost: number;
  cumBuySpend: number;
  cumRentSpend: number;
  propertyValue: number;
  equity: number;
  netBuyCost: number;
  netRentCost: number;
  advantage: number;
}

export interface CalcResult {
  totalPurchasePrice: number;
  propType: string;
  totalAcq: number;
  mansionPerUnit: number;
  mansionTotal: number;
  acqBrokerLegal: number;
  totalMaintenanceCosts: number;
  buyTotalSpend: number;
  saleValue: number;
  totalDisp: number;
  dispBrokerLegal: number;
  dispNYC: number;
  dispNYS: number;
  buyNetSpend: number;
  terminalValue: number;
  annualCarrying: number;
  annualRentCost: number;
  rentBrokerFee: number;
  rentTotalSpend: number;
  rentNetSpend: number;
  buyMonthlyCost: number;
  rentMonthlyCost: number;
  savings: number;
  buyWins: boolean;
  breakeven: number | null;
  yearlyData: YearlyRow[];
}

/* ─── TAX FUNCTIONS ─── */
export function nycTax(p: number, propType = "residential"): number {
  const res = propType === "residential";
  if (res) return p <= 500_000 ? p * 0.01 : p * 0.01425;
  return p <= 500_000 ? p * 0.01425 : p * 0.02625;
}

export function nysTax(p: number, propType = "residential"): number {
  const res = propType === "residential";
  if (res) return p < 3_000_000 ? p * 0.004 : p * 0.0065;
  return p < 2_000_000 ? p * 0.004 : p * 0.0065;
}

export function mansionTaxUnit(p: number): number {
  if (p < 1e6) return 0;
  if (p < 2e6) return p * 0.01;
  if (p < 3e6) return p * 0.0125;
  if (p < 5e6) return p * 0.015;
  if (p < 10e6) return p * 0.0225;
  if (p < 15e6) return p * 0.0325;
  if (p < 20e6) return p * 0.035;
  if (p < 25e6) return p * 0.0375;
  return p * 0.039;
}

/* ─── CALCULATION ENGINE (Excel-matched) ─── */
export function runCalculation(p: CalcParams): CalcResult {
  const tp = p.pricePerUnit * p.units;
  const mo = p.timelineYears * 12;
  const ac = 12 * (p.commonCharges + p.propertyTaxes) * p.units;

  const ACQ_PCT = p.acqPct;
  const DISP_PCT = p.dispPct;
  const MAINT_PCT = p.maintPct;
  const RENT_BRK_PCT = p.rentBrkPct;

  // Acquisition: per-unit mansion tax
  const totalAcq = ACQ_PCT * tp;
  const mansionPerUnit = mansionTaxUnit(p.pricePerUnit);
  const mansionTotal = mansionPerUnit * p.units;
  const acqBrokerLegal = Math.max(0, totalAcq - mansionTotal);

  // Maintenance
  const maintCost = p.units * ((MAINT_PCT * p.timelineYears) / 10) * p.pricePerUnit;

  const fvB = (Math.pow(1 + p.appreciation, p.timelineYears) - 1) / p.appreciation;
  const buyTotal = ac * fvB + tp + maintCost + totalAcq;
  const sale = tp * Math.pow(1 + p.appreciation, p.timelineYears);

  // Disposal: transfer taxes at sale
  const totalDisp = DISP_PCT * sale;
  const dispNYC = nycTax(sale, p.propType);
  const dispNYS = nysTax(sale, p.propType);
  const dispBrokerLegal = Math.max(0, totalDisp - dispNYC - dispNYS);

  const buyNet = buyTotal + totalDisp - sale;
  const terminal = sale - totalDisp;

  // Rent
  const ar = (p.monthlyRent + p.otherCharges + p.rentTaxes) * p.units * 12;
  const brkFee = RENT_BRK_PCT * ar;
  const fvR =
    ((Math.pow(1 + p.rentGrowth, p.timelineYears) - 1) / p.rentGrowth) *
    (1 + p.rentGrowth);
  const rentTotal = ar * fvR + brkFee;

  const yearlyData: YearlyRow[] = [];
  let cumBuy = tp + totalAcq;
  let cumRent = 0;

  for (let y = 1; y <= p.timelineYears; y++) {
    const yc = ac * Math.pow(1 + p.appreciation, y - 1);
    const ym = y % 10 === 0 ? MAINT_PCT * tp : 0;
    cumBuy += yc + ym;
    const yr = ar * Math.pow(1 + p.rentGrowth, y - 1);
    cumRent += yr;
    const pv = tp * Math.pow(1 + p.appreciation, y);
    const yd = DISP_PCT * pv;
    const eq = pv - yd;
    const nb = cumBuy + yd - pv;
    yearlyData.push({
      year: y,
      buyAnnualCost: Math.round(yc),
      rentAnnualCost: Math.round(yr),
      cumBuySpend: Math.round(cumBuy),
      cumRentSpend: Math.round(cumRent),
      propertyValue: Math.round(pv),
      equity: Math.round(eq),
      netBuyCost: Math.round(nb),
      netRentCost: Math.round(cumRent),
      advantage: Math.round(cumRent - nb),
    });
  }

  return {
    totalPurchasePrice: tp,
    propType: p.propType,
    totalAcq,
    mansionPerUnit,
    mansionTotal,
    acqBrokerLegal,
    totalMaintenanceCosts: maintCost,
    buyTotalSpend: buyTotal,
    saleValue: sale,
    totalDisp,
    dispBrokerLegal,
    dispNYC,
    dispNYS,
    buyNetSpend: buyNet,
    terminalValue: terminal,
    annualCarrying: ac,
    annualRentCost: ar,
    rentBrokerFee: brkFee,
    rentTotalSpend: rentTotal,
    rentNetSpend: rentTotal,
    buyMonthlyCost: buyNet / mo,
    rentMonthlyCost: rentTotal / mo,
    savings: rentTotal - buyNet,
    buyWins: buyNet < rentTotal,
    breakeven: yearlyData.find((d) => d.advantage > 0)?.year ?? null,
    yearlyData,
  };
}

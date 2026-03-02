import type { CalcParams } from "./defaults";

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
  totalAcquisitionCosts: number;
  closingCosts: number;
  nycTransferTax: number;
  nysTransferTax: number;
  mansionTax: number;
  totalMaintenanceCosts: number;
  buyTotalSpend: number;
  saleValue: number;
  totalDisposalCosts: number;
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
  breakevenYear: number | null;
  yearlyData: YearlyRow[];
}

/* ─── TAX FUNCTIONS ─── */
export function calcNYCTransferTax(p: number, t = "condo"): number {
  const c = t === "condo" || t === "coop" || t === "house";
  if (c) return p <= 500_000 ? p * 0.01 : p * 0.01425;
  return p <= 500_000 ? p * 0.01425 : p * 0.02625;
}

export function calcNYSTransferTax(p: number, t = "condo"): number {
  const c = t === "condo" || t === "coop" || t === "house";
  if (c) return p < 3_000_000 ? p * 0.004 : p * 0.0065;
  return p < 2_000_000 ? p * 0.004 : p * 0.0065;
}

export function calcMansionTax(p: number): number {
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
  const acqCost = p.acquisitionCostPct * tp;
  const nycTx = calcNYCTransferTax(tp, p.propertyType);
  const nysTx = calcNYSTransferTax(tp, p.propertyType);
  const manTx = calcMansionTax(tp);
  const closingCosts = Math.max(0, acqCost - nycTx - nysTx - manTx);
  const maintCost = p.units * ((p.maintenancePct * p.timelineYears) / 10) * p.pricePerUnit;
  const fvB = (Math.pow(1 + p.annualAppreciation, p.timelineYears) - 1) / p.annualAppreciation;
  const buyTotal = ac * fvB + tp + maintCost + acqCost;
  const sale = tp * Math.pow(1 + p.annualAppreciation, p.timelineYears);
  const dispCost = p.disposalCostPct * sale;
  const buyNet = buyTotal + dispCost - sale;
  const terminal = sale - dispCost;
  const ar = (p.monthlyRent + p.otherCharges + p.rentTaxes) * p.units * 12;
  const brkFee = p.rentBrokerPct * ar;
  const fvR =
    ((Math.pow(1 + p.annualRentGrowth, p.timelineYears) - 1) / p.annualRentGrowth) *
    (1 + p.annualRentGrowth);
  const rentTotal = ar * fvR + brkFee;

  const yearlyData: YearlyRow[] = [];
  let cumBuy = tp + acqCost;
  let cumRent = 0;

  for (let y = 1; y <= p.timelineYears; y++) {
    const yc = ac * Math.pow(1 + p.annualAppreciation, y - 1);
    const ym = y % 10 === 0 ? p.maintenancePct * tp : 0;
    cumBuy += yc + ym;
    const yr = ar * Math.pow(1 + p.annualRentGrowth, y - 1);
    cumRent += yr;
    const pv = tp * Math.pow(1 + p.annualAppreciation, y);
    const yd = p.disposalCostPct * pv;
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
    totalAcquisitionCosts: acqCost,
    closingCosts,
    nycTransferTax: nycTx,
    nysTransferTax: nysTx,
    mansionTax: manTx,
    totalMaintenanceCosts: maintCost,
    buyTotalSpend: buyTotal,
    saleValue: sale,
    totalDisposalCosts: dispCost,
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
    breakevenYear: yearlyData.find((d) => d.advantage > 0)?.year ?? null,
    yearlyData,
  };
}

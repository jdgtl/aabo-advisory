import { useState, useMemo, useEffect, useRef } from "react";
import { runCalculation } from "./engine";
import { defaults } from "./defaults";
import { fmtFull } from "./formatters";
import { trackCalculatorStarted, trackCTAClicked } from "@/lib/analytics";
import type { CalculatorData } from "../interactive/LeadGate";

import DollarInput from "./inputs/DollarInput";
import Input from "./inputs/Input";
import SelectInput from "./inputs/SelectInput";
import InfoTip from "./results/InfoTip";

import Verdict from "./results/Verdict";
import MetricCard from "./results/MetricCard";
import ResultActions from "./results/ResultActions";

import SummaryChart from "./charts/SummaryChart";
import AnnualChart from "./charts/AnnualChart";
import CumulativeChart from "./charts/CumulativeChart";
import AdvantageChart from "./charts/AdvantageChart";
import TaxDetailChart from "./charts/TaxDetailChart";

type TabId = "summary" | "annual" | "cumulative" | "advantage" | "taxes";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "annual", label: "Annual Costs" },
  { id: "cumulative", label: "Cumulative" },
  { id: "advantage", label: "Net Advantage" },
  { id: "taxes", label: "Tax Detail" },
];

interface Props {
  /** CMS content for the calculator page */
  cms?: {
    verdictBuyText?: string;
    verdictRentText?: string;
    disclaimerText?: string;
    ctaLabel?: string;
    ctaHeadline?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
  };
  /** Callback when "View Full Analysis" is clicked (triggers lead gate) */
  onRequestFullAnalysis?: (data?: CalculatorData) => void;
  /** Whether full analysis is unlocked */
  unlocked?: boolean;
  /** User info from lead gate */
  userName?: string;
  userEmail?: string;
  userOrg?: string;
}

export default function Calculator({ cms, onRequestFullAnalysis, unlocked = false, userName, userEmail, userOrg }: Props) {
  const [units, setUnits] = useState<number>(defaults.units);
  const [pricePerUnit, setPricePerUnit] = useState<number>(defaults.pricePerUnit);
  const [commonCharges, setCommonCharges] = useState<number>(defaults.commonCharges);
  const [propertyTaxes, setPropertyTaxes] = useState<number>(defaults.propertyTaxes);
  const [propType, setPropType] = useState<string>(defaults.propType);
  const [monthlyRent, setMonthlyRent] = useState<number>(defaults.monthlyRent);
  const [otherCharges, setOtherCharges] = useState<number>(defaults.otherCharges);
  const [rentTaxes, setRentTaxes] = useState<number>(defaults.rentTaxes);
  const [timelineYears, setTimelineYears] = useState<number>(defaults.timelineYears);
  const [annualAppreciation, setAnnualAppreciation] = useState<number>(defaults.annualAppreciation);
  const [annualRentGrowth, setAnnualRentGrowth] = useState<number>(defaults.annualRentGrowth);
  const [activeView, setActiveView] = useState<TabId>("summary");
  const hasTrackedStart = useRef(false);

  // Track calculator started when user first enters any value
  useEffect(() => {
    if (!hasTrackedStart.current) {
      if (units > 0 || pricePerUnit > 0 || monthlyRent > 0) {
        hasTrackedStart.current = true;
        trackCalculatorStarted();
      }
    }
  }, [units, pricePerUnit, monthlyRent]);

  const result = useMemo(
    () =>
      runCalculation({
        units,
        pricePerUnit,
        commonCharges,
        propertyTaxes,
        monthlyRent,
        otherCharges,
        rentTaxes,
        timelineYears,
        appreciation: annualAppreciation / 100,
        rentGrowth: annualRentGrowth / 100,
        propType,
      }),
    [
      units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges,
      rentTaxes, timelineYears, annualAppreciation, annualRentGrowth, propType,
    ],
  );

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* ── INPUTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-6 lg:gap-10 mb-8">
        {/* Purchase Scenario */}
        <div>
          <div className="border-l-[3px] border-primary pl-4 mb-6">
            <div className="text-sm font-bold text-primary font-heading">Purchase Scenario</div>
            <div className="text-[11px] text-warm/60">Acquisition, carrying costs, and disposal</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} placeholder="e.g. 1" />
            <DollarInput label="Price per Unit" value={pricePerUnit} onChange={setPricePerUnit} placeholder="e.g. 2,000,000" />
            <DollarInput label="Common Charges /mo" value={commonCharges} onChange={setCommonCharges} placeholder="e.g. 1,200" />
            <DollarInput label="Property Taxes /mo" value={propertyTaxes} onChange={setPropertyTaxes} placeholder="e.g. 1,000" />
            {/* Property Classification */}
            <div>
              <div className="flex items-center text-[10px] tracking-[0.08em] uppercase text-text/45 mb-1.5 font-medium">
                Property Classification
                <InfoTip definition="NYC classifies properties with 4+ units as commercial. Select the classification that applies to your property type." />
              </div>
              <SelectInput
                value={propType}
                onChange={setPropType}
                options={[
                  { value: "residential", label: "Condos, Co-ops & 1\u20133 Family" },
                  { value: "commercial", label: "Commercial & All Other" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block bg-mid w-px" />

        {/* Rental Scenario */}
        <div>
          <div className="border-l-[3px] border-primary pl-4 mb-6">
            <div className="text-sm font-bold text-primary font-heading">Rental Scenario</div>
            <div className="text-[11px] text-warm/60">Monthly obligations and escalation</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} placeholder="e.g. 1" />
            <DollarInput label="Monthly Rent per Unit" value={monthlyRent} onChange={setMonthlyRent} placeholder="e.g. 8,000" />
            <DollarInput label="Other Charges /mo" value={otherCharges} onChange={setOtherCharges} placeholder="0" />
            <DollarInput label="Taxes /mo" value={rentTaxes} onChange={setRentTaxes} placeholder="0" />
          </div>
        </div>
      </div>

      {/* ── TIMELINE & GROWTH ── */}
      <div className="bg-light p-5 sm:p-7 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="text-[10px] tracking-[0.15em] uppercase text-accent font-semibold">
            Timeline &amp; Growth Assumptions
          </div>
          <div className="flex-1 h-px bg-mid" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-6 lg:gap-10">
          {/* Buy Assumptions */}
          <div>
            <div className="text-[10px] tracking-[0.08em] uppercase text-text/40 mb-3 font-semibold">Buy Assumptions</div>
            <div className="flex flex-wrap gap-4">
              <Input label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} placeholder="e.g. 30" />
              <Input label="Annual Appreciation" value={annualAppreciation} onChange={setAnnualAppreciation} suffix="%" min={-5} max={15} step={0.25} hint="Property value growth" placeholder="e.g. 2.5" />
            </div>
          </div>
          {/* Divider */}
          <div className="hidden lg:block bg-mid w-px" />
          {/* Rent Assumptions */}
          <div>
            <div className="text-[10px] tracking-[0.08em] uppercase text-text/40 mb-3 font-semibold">Rent Assumptions</div>
            <div className="flex flex-wrap gap-4">
              <Input label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} placeholder="e.g. 30" />
              <Input label="Annual Rent Growth" value={annualRentGrowth} onChange={setAnnualRentGrowth} suffix="%" min={0} max={15} step={0.25} hint="Market rent escalation" placeholder="e.g. 2.75" />
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION COST ASSUMPTIONS (fixed info cards) ── */}
      <div className="bg-light p-5 sm:p-7 mb-10 border border-mid">
        <div className="flex items-center gap-3 mb-5">
          <div className="text-[10px] tracking-[0.15em] uppercase text-accent font-semibold">
            Transaction Cost Assumptions
          </div>
          <div className="h-px w-[60px] bg-mid" />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px] bg-canvas p-4 border border-mid">
            <div className="flex items-center text-[10px] tracking-[0.08em] uppercase text-text/45 mb-1 font-medium">
              Acquisition Cost
              <InfoTip definition="All-in buyer-side costs at purchase: broker fees, legal fees, and mansion tax. Applied as a percentage of total purchase price." />
            </div>
            <div className="text-lg font-bold text-primary font-heading">2.00%</div>
          </div>
          <div className="flex-1 min-w-[140px] bg-canvas p-4 border border-mid">
            <div className="flex items-center text-[10px] tracking-[0.08em] uppercase text-text/45 mb-1 font-medium">
              Disposal Cost
              <InfoTip definition="Seller-side costs at sale: broker commission, legal fees, and NYC/NYS transfer taxes. Applied as a percentage of projected sale value." />
            </div>
            <div className="text-lg font-bold text-primary font-heading">7.50%</div>
          </div>
          <div className="flex-1 min-w-[140px] bg-canvas p-4 border border-mid">
            <div className="flex items-center text-[10px] tracking-[0.08em] uppercase text-text/45 mb-1 font-medium">
              Maintenance Cost
              <InfoTip definition="Estimated capital maintenance reserve applied per 10-year cycle as a percentage of purchase price per unit." />
            </div>
            <div className="text-lg font-bold text-primary font-heading">5.00%</div>
          </div>
          <div className="flex-1 min-w-[140px] bg-canvas p-4 border border-mid">
            <div className="flex items-center text-[10px] tracking-[0.08em] uppercase text-text/45 mb-1 font-medium">
              Rent Broker Fee
              <InfoTip definition="One-time broker fee when signing the lease, applied as a percentage of the first year's annual rent." />
            </div>
            <div className="text-lg font-bold text-primary font-heading">7.50%</div>
          </div>
        </div>
      </div>

      {/* ── VERDICT ── */}
      <Verdict result={result} timelineYears={timelineYears} />

      {/* ── METRICS ── */}
      <div className="flex flex-wrap gap-0.5 mb-10">
        <MetricCard
          label="Total Purchase Price"
          value={fmtFull(result.totalPurchasePrice)}
          sub={`${units} units \u00d7 ${fmtFull(pricePerUnit)}`}
          definition="The combined purchase price of all units."
          formula="Price per Unit \u00d7 Number of Units"
        />
        <MetricCard
          label={`Property Value Yr ${timelineYears}`}
          value={fmtFull(Math.round(result.saleValue))}
          sub={`${annualAppreciation}% annual growth`}
          definition="Projected market value of all units at the end of the hold period, assuming steady annual appreciation."
          formula="Total Purchase Price \u00d7 (1 + Appreciation Rate) ^ Hold Period"
        />
        <MetricCard
          label="Net Cost of Buying"
          value={fmtFull(Math.round(result.buyNetSpend))}
          accent
          sub={`${fmtFull(Math.round(result.buyMonthlyCost))}/mo effective`}
          definition="Total out-of-pocket cost of ownership minus the proceeds from selling."
          formula="Total Spend + Disposal Costs \u2212 Sale Value"
        />
        <MetricCard
          label="Total Cost of Renting"
          value={fmtFull(Math.round(result.rentNetSpend))}
          sub={`${fmtFull(Math.round(result.rentMonthlyCost))}/mo effective`}
          definition="Total rent paid over the hold period, accounting for annual rent increases, plus the one-time broker fee."
          formula="FV of Annual Rent (annuity due) + Broker Fee"
        />
        <MetricCard
          label="Terminal Equity"
          value={fmtFull(Math.round(result.terminalValue))}
          accent
          sub="After disposal costs"
          definition="The net equity you walk away with after selling the property and paying all disposal costs."
          formula="Sale Value \u2212 (Broker Fees + NYC Tax + NYS Tax)"
        />
      </div>

      {/* ── RESULT ACTIONS ── */}
      {unlocked && (
        <ResultActions
          inputs={{
            units,
            pricePerUnit,
            commonCharges,
            propertyTaxes,
            propType,
            monthlyRent,
            otherCharges,
            rentTaxes,
            timelineYears,
            annualAppreciation,
            annualRentGrowth,
            result,
            userName,
            userOrg,
          }}
          userEmail={userEmail}
        />
      )}

      {/* ── GATED SECTION ── */}
      {!unlocked && onRequestFullAnalysis ? (
        <div className="relative mb-14">
          {/* Blurred preview */}
          <div className="filter blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">
            <div className="flex gap-0 border-b border-mid mb-8">
              {TABS.map((tab) => (
                <div key={tab.id} className="px-5 py-3.5 text-xs font-body text-text/40 border-b-2 border-transparent">
                  {tab.label}
                </div>
              ))}
            </div>
            <div className="h-[200px] bg-light/50" />
          </div>
          {/* Gate overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/80 backdrop-blur-sm">
            <div className="text-center max-w-md px-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-3 font-semibold">
                Detailed Analysis
              </div>
              <h3 className="font-heading text-2xl font-bold text-primary mb-3">
                Detailed Projections
              </h3>
              <p className="text-sm text-text/55 mb-6 leading-relaxed">
                Year-by-year projections, comparative charts, and a complete tax breakdown.
              </p>
              <button
                onClick={() => {
                  const totalPrice = units * pricePerUnit;
                  onRequestFullAnalysis?.({
                    priceRange: fmtFull(totalPrice),
                    units,
                    timeline: timelineYears,
                    verdict: result.buyWins ? "buy" : "rent",
                    savings: fmtFull(Math.abs(result.savings)),
                    pricePerUnit,
                    commonCharges,
                    propertyTaxes,
                    propType,
                    monthlyRent,
                    otherCharges,
                    rentTaxes,
                    annualAppreciation,
                    annualRentGrowth,
                  });
                }}
                className="bg-primary text-canvas px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-body font-medium transition-all duration-300 hover:bg-secondary hover:-translate-y-px cursor-pointer"
              >
                View Full Analysis
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── CHART TABS ── */}
          <div className="flex gap-0 border-b border-mid mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`bg-transparent border-none cursor-pointer px-5 py-3.5 text-xs font-body tracking-[0.04em] transition-all duration-[250ms] -mb-px ${
                  activeView === tab.id
                    ? "font-bold text-primary border-b-2 border-accent"
                    : "font-normal text-text/40 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CHARTS ── */}
          <div className="mb-14">
            {activeView === "summary" && <SummaryChart result={result} />}
            {activeView === "annual" && <AnnualChart result={result} />}
            {activeView === "cumulative" && <CumulativeChart result={result} />}
            {activeView === "advantage" && <AdvantageChart result={result} />}
            {activeView === "taxes" && (
              <TaxDetailChart
                result={result}
                pricePerUnit={pricePerUnit}
                units={units}
                propType={propType}
                timelineYears={timelineYears}
              />
            )}
          </div>

          {/* ── DATA TABLE ── */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-[11px] tracking-[0.15em] uppercase text-accent font-semibold">
                Year-by-Year Projection
              </div>
              <div className="flex-1 h-px bg-mid" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-body">
                <thead>
                  <tr className="border-b-2 border-accent">
                    {["Year", "Buy Annual", "Rent Annual", "Cum. Buy", "Cum. Rent", "Est. Property Value", "Net Equity", "Advantage"].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={`py-2.5 px-3 text-[10px] tracking-[0.08em] uppercase text-accent font-semibold whitespace-nowrap ${i === 0 ? "text-center" : "text-right"}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyData.map((d, i) => (
                    <tr key={d.year} className={`border-b border-mid ${i % 2 === 0 ? "" : "bg-light/40"}`}>
                      <td className="py-2.5 px-3 text-center font-bold text-primary font-heading">{d.year}</td>
                      <td className="py-2.5 px-3 text-right text-text/70">{fmtFull(d.buyAnnualCost)}</td>
                      <td className="py-2.5 px-3 text-right text-text/70">{fmtFull(d.rentAnnualCost)}</td>
                      <td className="py-2.5 px-3 text-right text-primary font-semibold">{fmtFull(d.cumBuySpend)}</td>
                      <td className="py-2.5 px-3 text-right text-accent font-semibold">{fmtFull(d.cumRentSpend)}</td>
                      <td className="py-2.5 px-3 text-right text-text/60">{fmtFull(d.propertyValue)}</td>
                      <td className="py-2.5 px-3 text-right text-green font-semibold">{fmtFull(d.equity)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${d.advantage >= 0 ? "text-green" : "text-red"}`}>
                        {d.advantage >= 0 ? "+" : ""}
                        {fmtFull(d.advantage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CONSULTATION CTA ── */}
      <div className="bg-primary px-6 sm:px-10 py-8 sm:py-10 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.2em] uppercase text-accent mb-2 font-semibold">
            {cms?.ctaLabel || "Tailored Assessment"}
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-canvas mb-2 leading-[1.2]">
            {cms?.ctaHeadline || "This analysis reflects general assumptions."}
          </h3>
          <p className="text-sm leading-relaxed text-warm/70">
            {cms?.ctaDescription || "For a confidential assessment tailored to your mission\u2019s specific situation, schedule a consultation."}
          </p>
        </div>
        <a
          href="/#contact"
          onClick={() => trackCTAClicked("calculator-consultation")}
          className="shrink-0 bg-accent text-primary px-7 py-3.5 text-[11px] tracking-[0.14em] uppercase font-body font-medium transition-all duration-300 hover:bg-canvas hover:-translate-y-px"
        >
          {cms?.ctaButtonText || "Schedule a Consultation"}
        </a>
      </div>

      {/* ── DISCLAIMER ── */}
      <div className="pt-8 pb-14 border-t border-mid">
        <div className="text-[10px] tracking-[0.12em] uppercase text-accent mb-3 font-semibold">Disclaimer</div>
        <p className="text-xs leading-[1.8] text-text/40 max-w-[700px]">
          {cms?.disclaimerText ??
            "This calculator provides estimates for illustrative purposes only and does not constitute financial, tax, or legal advice. Actual costs will vary based on specific property characteristics, market conditions, financing terms, and individual circumstances. NYC transfer taxes, NYS transfer taxes, and mansion tax rates are based on current published schedules and may change. Consult qualified professionals before making real estate decisions."}
        </p>
      </div>
    </div>
  );
}

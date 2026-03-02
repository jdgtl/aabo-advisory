import { useState, useMemo } from "react";
import { runCalculation } from "./engine";
import { defaults } from "./defaults";
import { fmtFull } from "./formatters";

import DollarInput from "./inputs/DollarInput";
import Input from "./inputs/Input";
import SelectInput from "./inputs/SelectInput";

import Verdict from "./results/Verdict";
import MetricCard from "./results/MetricCard";

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
  };
  /** Callback when "View Full Analysis" is clicked (triggers lead gate) */
  onRequestFullAnalysis?: () => void;
  /** Whether full analysis is unlocked */
  unlocked?: boolean;
}

export default function Calculator({ cms, onRequestFullAnalysis, unlocked = false }: Props) {
  const [units, setUnits] = useState<number>(defaults.units);
  const [pricePerUnit, setPricePerUnit] = useState<number>(defaults.pricePerUnit);
  const [commonCharges, setCommonCharges] = useState<number>(defaults.commonCharges);
  const [propertyTaxes, setPropertyTaxes] = useState<number>(defaults.propertyTaxes);
  const [propertyType, setPropertyType] = useState<string>(defaults.propertyType);
  const [monthlyRent, setMonthlyRent] = useState<number>(defaults.monthlyRent);
  const [otherCharges, setOtherCharges] = useState<number>(defaults.otherCharges);
  const [rentTaxes, setRentTaxes] = useState<number>(defaults.rentTaxes);
  const [rentBrokerPct, setRentBrokerPct] = useState<number>(defaults.rentBrokerPct);
  const [timelineYears, setTimelineYears] = useState<number>(defaults.timelineYears);
  const [annualAppreciation, setAnnualAppreciation] = useState<number>(defaults.annualAppreciation);
  const [annualRentGrowth, setAnnualRentGrowth] = useState<number>(defaults.annualRentGrowth);
  const [acquisitionCostPct, setAcquisitionCostPct] = useState<number>(defaults.acquisitionCostPct);
  const [disposalCostPct, setDisposalCostPct] = useState<number>(defaults.disposalCostPct);
  const [maintenancePct, setMaintenancePct] = useState<number>(defaults.maintenancePct);
  const [activeView, setActiveView] = useState<TabId>("summary");
  const [showAdvanced, setShowAdvanced] = useState(true);

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
        annualAppreciation: annualAppreciation / 100,
        annualRentGrowth: annualRentGrowth / 100,
        acquisitionCostPct: acquisitionCostPct / 100,
        disposalCostPct: disposalCostPct / 100,
        maintenancePct: maintenancePct / 100,
        rentBrokerPct: rentBrokerPct / 100,
        propertyType,
      }),
    [
      units, pricePerUnit, commonCharges, propertyTaxes, monthlyRent, otherCharges,
      rentTaxes, timelineYears, annualAppreciation, annualRentGrowth,
      acquisitionCostPct, disposalCostPct, maintenancePct, rentBrokerPct, propertyType,
    ],
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* ── INPUTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-6 lg:gap-10 mb-8">
        {/* Purchase Scenario */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 bg-primary flex items-center justify-center text-[11px] text-accent font-bold font-heading">
              B
            </div>
            <div>
              <div className="text-sm font-bold text-primary font-heading">Purchase Scenario</div>
              <div className="text-[11px] text-warm/60">Acquisition, carrying, and disposal</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
            <DollarInput label="Price per Unit" value={pricePerUnit} onChange={setPricePerUnit} />
            <DollarInput label="Common Charges /mo" value={commonCharges} onChange={setCommonCharges} />
            <DollarInput label="Property Taxes /mo" value={propertyTaxes} onChange={setPropertyTaxes} />
            <SelectInput
              label="Property Type"
              value={propertyType}
              onChange={setPropertyType}
              options={[
                { value: "condo", label: "Condo / Co-op" },
                { value: "other", label: "All Other Types" },
              ]}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block bg-mid w-px" />

        {/* Rental Scenario */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 bg-canvas border-[1.5px] border-primary flex items-center justify-center text-[11px] text-primary font-bold font-heading">
              R
            </div>
            <div>
              <div className="text-sm font-bold text-primary font-heading">Rental Scenario</div>
              <div className="text-[11px] text-warm/60">Monthly obligations over time</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input label="Units" value={units} onChange={setUnits} min={1} max={50} step={1} />
            <DollarInput label="Monthly Rent /unit" value={monthlyRent} onChange={setMonthlyRent} />
            <DollarInput label="Other Charges /mo" value={otherCharges} onChange={setOtherCharges} />
            <DollarInput label="Taxes /mo /unit" value={rentTaxes} onChange={setRentTaxes} />
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
        <div className="flex flex-wrap gap-4 items-start">
          <Input label="Hold Period (Years)" value={timelineYears} onChange={setTimelineYears} suffix="yrs" min={1} max={30} step={1} />
          <Input label="Annual Appreciation" value={annualAppreciation} onChange={setAnnualAppreciation} suffix="%" min={-5} max={15} step={0.25} hint="Property value growth" />
          <Input label="Annual Rent Growth" value={annualRentGrowth} onChange={setAnnualRentGrowth} suffix="%" min={0} max={15} step={0.25} hint="Market rent escalation" />
        </div>
      </div>

      {/* ── TRANSACTION COST ASSUMPTIONS ── */}
      <div className="bg-light p-5 sm:p-7 mb-10 border border-mid">
        <div
          className="flex items-center justify-between cursor-pointer"
          style={{ marginBottom: showAdvanced ? 20 : 0 }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="flex items-center gap-3">
            <div className="text-[10px] tracking-[0.15em] uppercase text-accent font-semibold">
              Transaction Cost Assumptions
            </div>
            <div className="h-px w-[60px] bg-mid" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-accent font-medium tracking-[0.04em]">
            {showAdvanced ? "Collapse" : "Expand"}
            <span
              className="inline-block text-base leading-none transition-transform duration-300"
              style={{ transform: showAdvanced ? "rotate(180deg)" : "none" }}
            >
              ⌄
            </span>
          </div>
        </div>
        {showAdvanced && (
          <div className="flex flex-wrap gap-4">
            <Input label="Acquisition Costs" value={acquisitionCostPct} onChange={setAcquisitionCostPct} suffix="%" min={0} max={15} step={0.5} hint="All-in: broker, legal, taxes" />
            <Input label="Disposal Costs" value={disposalCostPct} onChange={setDisposalCostPct} suffix="%" min={0} max={15} step={0.5} hint="Broker + legal at sale" />
            <Input label="Maintenance Cost" value={maintenancePct} onChange={setMaintenancePct} suffix="%" min={0} max={20} step={0.5} hint="Per 10-year cycle" />
            <Input label="Rent Broker Fee" value={rentBrokerPct} onChange={setRentBrokerPct} suffix="%" min={0} max={15} step={0.5} hint="One-time, on annual rent" />
          </div>
        )}
      </div>

      {/* ── VERDICT ── */}
      <Verdict result={result} timelineYears={timelineYears} />

      {/* ── METRICS ── */}
      <div className="flex flex-wrap gap-0.5 mb-10">
        <MetricCard
          label="Total Purchase Price"
          value={fmtFull(result.totalPurchasePrice)}
          sub={`${units} units × ${fmtFull(pricePerUnit)}`}
          definition="The combined purchase price of all units."
          formula="Price per Unit × Number of Units"
        />
        <MetricCard
          label={`Property Value Yr ${timelineYears}`}
          value={fmtFull(Math.round(result.saleValue))}
          sub={`${annualAppreciation}% annual growth`}
          definition="Projected market value of all units at the end of the hold period, assuming steady annual appreciation."
          formula="Total Purchase Price × (1 + Appreciation Rate) ^ Hold Period"
        />
        <MetricCard
          label="Net Cost of Buying"
          value={fmtFull(Math.round(result.buyNetSpend))}
          accent
          sub={`${fmtFull(Math.round(result.buyMonthlyCost))}/mo effective`}
          definition="Total out-of-pocket cost of ownership minus the proceeds from selling."
          formula="Total Spend + Disposal Costs − Sale Value"
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
          formula="Sale Value − Disposal Costs"
        />
      </div>

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
                Full Analysis
              </div>
              <h3 className="font-heading text-2xl font-bold text-primary mb-3">
                Unlock Detailed Projections
              </h3>
              <p className="text-sm text-text/55 mb-6 leading-relaxed">
                Access all charts, year-by-year projections, and tax detail breakdowns.
              </p>
              <button
                onClick={onRequestFullAnalysis}
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
                propertyType={propertyType}
                disposalCostPct={disposalCostPct}
                rentBrokerPct={rentBrokerPct}
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
                    {["Year", "Buy Annual", "Rent Annual", "Cum. Buy", "Cum. Rent", "Property Value", "Net Equity", "Advantage"].map(
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

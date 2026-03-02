import { useState, useCallback } from "react";
import Calculator from "./Calculator";
import LeadGate from "../interactive/LeadGate";
import type { CalculatorData } from "../interactive/LeadGate";
import { trackFullResultsViewed } from "@/lib/analytics";

interface Props {
  cms: {
    verdictBuyText?: string;
    verdictRentText?: string;
    disclaimerText?: string;
    gateHeadline?: string;
    gateSubtext?: string;
    gateButtonText?: string;
  };
}

const STORAGE_KEY = "aabo_calculator_unlocked";

export default function CalculatorIsland({ cms }: Props) {
  const [gateOpen, setGateOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [calcData, setCalcData] = useState<CalculatorData | undefined>();

  const handleRequestFullAnalysis = useCallback(
    (data?: CalculatorData) => {
      if (!unlocked) {
        setCalcData(data);
        setGateOpen(true);
      }
    },
    [unlocked],
  );

  return (
    <>
      <Calculator
        cms={cms}
        onRequestFullAnalysis={unlocked ? undefined : handleRequestFullAnalysis}
        unlocked={unlocked}
      />

      {gateOpen && (
        <LeadGate
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setUnlocked(true);
            setGateOpen(false);
            try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
            trackFullResultsViewed();
          }}
          cms={cms}
          calculatorData={calcData}
        />
      )}
    </>
  );
}

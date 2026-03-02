import { useState } from "react";
import Calculator from "./Calculator";
import LeadGate from "../interactive/LeadGate";

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

export default function CalculatorIsland({ cms }: Props) {
  const [gateOpen, setGateOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  return (
    <>
      <Calculator
        cms={cms}
        onRequestFullAnalysis={unlocked ? undefined : () => setGateOpen(true)}
        unlocked={unlocked}
      />

      {gateOpen && (
        <LeadGate
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setUnlocked(true);
            setGateOpen(false);
          }}
          cms={cms}
        />
      )}
    </>
  );
}

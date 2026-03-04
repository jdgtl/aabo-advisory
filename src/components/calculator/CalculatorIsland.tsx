import { useState, useCallback, useEffect } from "react";
import Calculator from "./Calculator";
import LeadGate from "../interactive/LeadGate";
import type { CalculatorData } from "../interactive/LeadGate";
import { trackFullResultsViewed } from "@/lib/analytics";
import { setUserEmail } from "./calculatorState";

interface Props {
  cms: {
    verdictBuyText?: string;
    verdictRentText?: string;
    disclaimerText?: string;
    gateHeadline?: string;
    gateSubtext?: string;
    gateButtonText?: string;
    ctaLabel?: string;
    ctaHeadline?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
  };
}

const STORAGE_KEY = "aabo_calculator_unlocked";
const USER_KEY = "aabo_calculator_user";

interface UserInfo {
  name: string;
  email: string;
  org: string;
}

function loadUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export default function CalculatorIsland({ cms }: Props) {
  const [gateOpen, setGateOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [calcData, setCalcData] = useState<CalculatorData | undefined>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => loadUserInfo());

  // Sync user email to shared state for the sticky bar
  useEffect(() => {
    setUserEmail(userInfo?.email);
  }, [userInfo?.email]);

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
        userName={userInfo?.name}
        userEmail={userInfo?.email}
        userOrg={userInfo?.org}
      />

      {gateOpen && (
        <LeadGate
          onClose={() => setGateOpen(false)}
          onSuccess={(info) => {
            setUserInfo(info);
            try { localStorage.setItem(USER_KEY, JSON.stringify(info)); } catch {}
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

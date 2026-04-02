import type { CalcResult } from "../engine";
import { fmtFull, fmt } from "../formatters";

export interface EmailInputs {
  units: number;
  pricePerUnit: number;
  timelineYears: number;
  annualAppreciation: number;
  annualRentGrowth: number;
  monthlyRent: number;
  result: CalcResult;
  userName: string;
  userOrg?: string;
}

/* Brand colors */
const C = {
  primary: "#0F1B2D",
  accent: "#B8965A",
  canvas: "#FAF8F5",
  text: "#1A1A1A",
  warm: "#C8B89A",
  mid: "#E8DFD0",
  light: "#F5F0E8",
  green: "#4A7C59",
};

export function buildEmailHtml(inputs: EmailInputs): string {
  const { result, timelineYears, userName } = inputs;
  const firstName = userName.split(" ")[0] || userName;

  const verdictLabel = result.buyWins
    ? "Ownership creates a sovereign advantage."
    : "Renting is more cost-effective in this scenario.";

  const verdictBg = result.buyWins ? C.primary : C.light;
  const verdictText = result.buyWins ? C.canvas : C.primary;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Portfolio Analysis</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Georgia,'Times New Roman',Times,serif;">

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- Email body -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="background-color:${C.primary};padding:24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:${C.accent};font-size:16px;font-weight:700;letter-spacing:0.12em;font-family:Georgia,'Times New Roman',serif;">AABO ADVISORY</td>
                  <td align="right" style="color:${C.warm};font-size:10px;letter-spacing:0.1em;font-family:Georgia,'Times New Roman',serif;">PORTFOLIO ANALYSIS</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:3px;background-color:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 20px;">
              <p style="margin:0 0 12px;font-size:15px;color:${C.primary};font-weight:700;">Dear ${firstName},</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${C.text};opacity:0.7;">
                Your portfolio analysis is enclosed. A PDF copy is attached for your records.
              </p>
            </td>
          </tr>

          <!-- Verdict -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background-color:${verdictBg};border-left:4px solid ${C.accent};padding:18px 20px;">
                    <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.accent};font-weight:600;margin-bottom:6px;">${timelineYears}-Year Verdict</div>
                    <div style="font-size:16px;font-weight:700;color:${verdictText};margin-bottom:4px;">${verdictLabel}</div>
                    <div style="font-size:12px;color:${verdictText};opacity:0.6;">
                      Net savings of ${fmtFull(Math.abs(Math.round(result.savings)))} by ${result.buyWins ? "buying" : "renting"}.
                    </div>
                    <div style="margin-top:8px;font-size:22px;font-weight:700;color:${C.accent};">${fmt(Math.abs(result.savings))}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Key Metrics 2x2 -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="50%" style="padding:8px;background-color:${C.light};border:1px solid ${C.mid};vertical-align:top;">
                    <div style="font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};opacity:0.5;margin-bottom:3px;">Net Cost of Buying</div>
                    <div style="font-size:14px;font-weight:700;color:${C.primary};">${fmtFull(Math.round(result.buyNetSpend))}</div>
                  </td>
                  <td width="50%" style="padding:8px;background-color:${C.light};border:1px solid ${C.mid};vertical-align:top;">
                    <div style="font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};opacity:0.5;margin-bottom:3px;">Total Cost of Renting</div>
                    <div style="font-size:14px;font-weight:700;color:${C.primary};">${fmtFull(Math.round(result.rentNetSpend))}</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:8px;background-color:${C.light};border:1px solid ${C.mid};vertical-align:top;">
                    <div style="font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};opacity:0.5;margin-bottom:3px;">Terminal Equity</div>
                    <div style="font-size:14px;font-weight:700;color:${C.green};">${fmtFull(Math.round(result.terminalValue))}</div>
                  </td>
                  <td width="50%" style="padding:8px;background-color:${C.light};border:1px solid ${C.mid};vertical-align:top;">
                    <div style="font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:${C.text};opacity:0.5;margin-bottom:3px;">Property Value Yr ${timelineYears}</div>
                    <div style="font-size:14px;font-weight:700;color:${C.primary};">${fmtFull(Math.round(result.saleValue))}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:${C.accent};padding:14px 32px;">
                    <a href="https://aaboadvisory.com/#contact" style="color:${C.primary};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;font-family:Georgia,'Times New Roman',serif;">Schedule a Consultation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid ${C.mid};font-size:9px;color:${C.text};opacity:0.35;line-height:1.6;">
              This analysis provides estimates for illustrative purposes only and does not constitute financial, tax, or legal advice. Actual costs will vary. Consult qualified professionals before making real estate decisions.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${C.primary};padding:14px 32px;font-size:9px;color:${C.warm};opacity:0.6;letter-spacing:0.06em;font-family:Georgia,'Times New Roman',serif;">
              Aabo Advisory &middot; aaboadvisory.com &middot; Confidential
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   AABO ADVISORY — Diplomatic Dossier Template
   Standalone content reading experience for briefings,
   whitepapers, and field guides.
   ═══════════════════════════════════════════════════════════════ */

const T = {
  h: "'Playfair Display', Georgia, serif",
  b: "'DM Sans', sans-serif",
};

const C = {
  primary: "#0F1B2D",
  secondary: "#1A2D47",
  text: "#1A1A1A",
  accent: "#B8965A",
  warm: "#C8B89A",
  mid: "#E8DFD0",
  light: "#F5F0E8",
  canvas: "#FAF8F5",
};

/* ───────── SCROLL REVEAL ───────── */
function useReveal(th = 0.13) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); o.unobserve(el); } },
      { threshold: th }
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

function R({ children, delay = 0 }) {
  const [ref, v] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? "none" : "translateY(32px)",
      transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ───────── HOVER BUTTON ───────── */
function HBtn({ children, style, hBg, hCol, ...p }) {
  const [h, sH] = useState(false);
  return (
    <button
      onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{
        ...style,
        background: h ? (hBg || style.background) : style.background,
        color: h ? (hCol || style.color) : style.color,
        transition: "all .3s cubic-bezier(.4,0,.2,1)",
        transform: h ? "translateY(-1px)" : "none",
      }}
      {...p}
    >
      {children}
    </button>
  );
}

/* ───────── ARTICLE DATA ───────── */
const ARTICLES = [
  {
    category: "Strategic Whitepaper",
    title: "A 30-Year View on Diplomatic Housing in New York",
    excerpt: "Why diplomatic housing decisions deserve the same rigor applied to any long-term sovereign asset.",
    date: "February 2025",
    readTime: "12 min read",
    body: `Diplomatic housing is not a line item. It is infrastructure — as consequential to a mission's long-term viability as the embassy building itself.\n\nYet in most capitals, housing decisions for diplomatic staff are made reactively: leases renewed under time pressure, purchases deferred due to budget cycle constraints, and portfolios assembled without a coherent strategy. The result is a patchwork of commitments that serves neither headquarters nor the personnel who live in these spaces.\n\nThis paper argues for a fundamental reframing. Diplomatic housing should be evaluated through a 30-year lens — the same horizon applied to sovereign infrastructure, embassy construction, and long-term asset planning.\n\nThe rationale is straightforward. Missions are permanent. Staff rotate, but the institution endures. A housing portfolio built around short-term leases creates recurring exposure to market volatility, landlord discretion, and operational disruption. Ownership — pursued strategically — can eliminate these risks while building equity that compounds over decades.\n\nConsider the arithmetic. A diplomatic mission leasing ten apartments in Manhattan at current market rates will spend approximately $45–60 million over 30 years, adjusted for rent escalation. That capital is non-recoverable. An equivalent portfolio of owned units, acquired strategically over a 5–7 year period, would cost $25–35 million in acquisition, with maintenance and carrying costs well below cumulative lease obligations.\n\nThe financial case is compelling. But the operational case may be stronger.\n\nOwned housing provides continuity. Incoming staff arrive to maintained, familiar residences. There is no lease negotiation, no broker involvement, no risk of displacement. The mission controls its environment — a meaningful consideration for personnel operating far from home in high-cost cities.\n\nOwnership also creates institutional memory. A well-maintained portfolio becomes part of the mission's infrastructure, managed with the same discipline applied to the chancery itself.\n\nThe barriers are real but navigable. Procurement timelines, budget approval processes, and political sensitivities around sovereign property acquisition all require careful management. But these are process challenges, not structural ones. With proper advisory support, they can be addressed within existing frameworks.\n\nThe question is not whether diplomatic missions should own housing. It is whether they can afford — operationally, financially, and strategically — not to.`,
  },
  {
    category: "Field Guide",
    title: "Pre-Closing Walk-Throughs in New Developments",
    excerpt: "A practical playbook for evaluating new development units before closing — tailored for mission procurement officers.",
    date: "January 2025",
    readTime: "8 min read",
    body: `The final walk-through is not a formality. For diplomatic missions acquiring new development units, it is the last opportunity to verify that the property meets contractual specifications before title transfers and leverage diminishes.\n\nThis guide provides a structured framework for mission procurement officers conducting pre-closing inspections in New York City new developments.\n\nThe stakes are particular to diplomatic buyers. Unlike individual purchasers, missions often acquire multiple units simultaneously, manage procurement through committee processes, and must document condition thoroughly for institutional records. A missed deficiency can become a multi-year remediation effort complicated by diplomatic protocols.\n\nBegin with the offering plan. Every new development unit in New York is sold pursuant to an offering plan filed with the Attorney General's office. This document specifies finishes, fixtures, appliance models, dimensions, and material specifications. It is the contractual baseline against which the delivered unit must be measured.\n\nBring the plan to the walk-through. Compare every specified element against what has been installed. Discrepancies — even minor ones — should be documented photographically and noted on the punch list.\n\nStructure your inspection systematically. Move room by room, starting with the entry. Check door hardware, hinges, and alignment. Test every light switch and outlet. Run all faucets simultaneously to test water pressure. Flush toilets. Open and close every window. Operate all appliances through a complete cycle.\n\nPay particular attention to finishes. New development units frequently present with cosmetic deficiencies: paint imperfections, tile alignment issues, countertop chips, cabinet door misalignment. These are correctable but must be identified before closing.\n\nDocument everything. Use a standardized checklist. Photograph each deficiency with a reference marker for scale. Note the date, unit number, and inspector on every form.\n\nThe developer's representative will typically accompany you. Be courteous but thorough. Do not allow time pressure to abbreviate your inspection. You are protecting sovereign assets.`,
  },
  {
    category: "Quiet Insight",
    title: "Why Ownership Can Create a Sovereign Advantage",
    excerpt: "How shifting from leasing to ownership can reduce long-term costs and create institutional continuity.",
    date: "December 2024",
    readTime: "5 min read",
    body: `There is a quiet shift happening in how diplomatic missions approach real estate in major capitals. The conversation is moving from "Where do we lease?" to "What should we own?"\n\nThis is not a new idea. Several missions have maintained owned portfolios for decades. But the current market environment — characterized by elevated rents, constrained supply, and favorable long-term interest rate projections — is making the ownership conversation more urgent.\n\nThe sovereign advantage of ownership is threefold.\n\nFirst, cost control. Owned assets remove exposure to landlord-driven rent increases, which in New York have averaged 3–5% annually over the past two decades. Over a 20-year horizon, the cumulative savings are substantial.\n\nSecond, operational continuity. Diplomatic staff rotate on 3–4 year cycles. Each rotation in a leased portfolio triggers a cascade of logistics: lease renewals, potential relocations, broker engagement, and transition costs. Owned units eliminate this friction entirely.\n\nThird, institutional presence. Ownership signals permanence. It communicates to host governments, to staff, and to the mission's own organizational culture that the institution is invested — literally — in its long-term presence.\n\nThe transition need not be abrupt. A phased acquisition strategy, targeting 2–3 units annually over a 5-year period, can build a meaningful portfolio without straining a single budget cycle.\n\nThe question for mission leadership is straightforward: Is your current leasing strategy serving the institution's 30-year interests, or merely solving this year's housing problem?`,
  },
];

/* ══════════════════════════════════════════════════════════
   MAIN DOSSIER APP
   ══════════════════════════════════════════════════════════ */
export default function AaboDossier() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (fontsLoaded) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap";
    document.head.appendChild(link);
    setFontsLoaded(true);
  }, []);

  useEffect(() => {
    const container = document.getElementById("dossier-scroll");
    if (!container) return;
    const handleScroll = () => setScrolled(container.scrollTop > 50);
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeArticle]);

  const openArticle = (idx) => {
    setActiveArticle(idx);
    setTimeout(() => {
      const el = document.getElementById("dossier-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };

  const goToIndex = () => {
    setActiveArticle(null);
    setTimeout(() => {
      const el = document.getElementById("dossier-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", fontFamily: T.b, color: C.text, background: C.canvas }}>
      <div id="dossier-scroll" style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", scrollBehavior: "smooth" }}>

        {/* NAV BAR */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: scrolled ? "12px 48px" : "20px 48px",
          background: scrolled ? `${C.canvas}F0` : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.mid}` : "1px solid transparent",
          transition: "all 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{
              fontFamily: T.h, fontSize: scrolled ? 17 : 19, fontWeight: 700,
              color: C.primary, letterSpacing: "0.08em", cursor: "pointer",
              transition: "all .3s ease",
            }} onClick={goToIndex}>AABO</span>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 500 }}>Advisory</span>
            <span style={{ fontSize: 10, letterSpacing: "0.08em", color: C.warm, opacity: 0.4, marginLeft: 8 }}>· Insights</span>
          </div>
          {activeArticle !== null && (
            <HBtn onClick={goToIndex}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, letterSpacing: "0.06em", color: C.accent, fontFamily: T.b, padding: "4px 0" }}
              hCol={C.primary}>← All Insights</HBtn>
          )}
        </nav>

        {activeArticle === null ? (
          /* ═══ INDEX VIEW ═══ */
          <>
            {/* Header */}
            <div style={{ padding: "60px 80px 48px", background: C.canvas }}>
              <div style={{ maxWidth: 1100 }}>
                <R>
                  <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Diplomatic Briefings</div>
                  <h1 style={{ fontFamily: T.h, fontSize: 48, fontWeight: 700, color: C.primary, margin: "0 0 16px 0", lineHeight: 1.12 }}>Insights & Field Guides</h1>
                  <div style={{ width: 48, height: 2, background: C.accent, marginBottom: 20 }} />
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: C.text, opacity: 0.55, maxWidth: 560, margin: 0 }}>Strategic observations and practical guidance for diplomatic missions navigating real estate in global capitals.</p>
                </R>
              </div>
            </div>

            {/* Article Cards */}
            <div style={{ padding: "0 80px 80px", background: C.canvas }}>
              <div style={{ maxWidth: 1100 }}>
                {ARTICLES.map((a, i) => (
                  <R key={i} delay={0.1 * i}>
                    <div
                      onClick={() => openArticle(i)}
                      style={{
                        display: "grid", gridTemplateColumns: "3px 1fr auto",
                        gap: 28, padding: "36px 0",
                        borderTop: `1px solid ${C.mid}`,
                        cursor: "pointer", alignItems: "center",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "12px"; e.currentTarget.style.background = `${C.light}88`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ background: C.accent, alignSelf: "stretch", borderRadius: 1 }} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          <div style={{ padding: "2px 8px", border: `1px solid ${C.accent}44`, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>{a.category}</div>
                          <span style={{ fontSize: 11, color: C.warm, opacity: 0.5 }}>{a.date}</span>
                        </div>
                        <h2 style={{ fontFamily: T.h, fontSize: 26, fontWeight: 700, color: C.primary, margin: "0 0 8px 0", lineHeight: 1.25 }}>{a.title}</h2>
                        <p style={{ fontSize: 14, lineHeight: 1.65, color: C.text, opacity: 0.55, margin: 0, maxWidth: 600 }}>{a.excerpt}</p>
                      </div>
                      <div style={{ fontSize: 11, color: C.accent, letterSpacing: "0.1em", whiteSpace: "nowrap", fontWeight: 500 }}>{a.readTime} →</div>
                    </div>
                  </R>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ═══ ARTICLE VIEW ═══ */
          (() => {
            const a = ARTICLES[activeArticle];
            const paragraphs = a.body.split("\n\n");
            return (
              <>
                {/* Classification Bar */}
                <div style={{ background: C.primary, padding: "0 80px", borderBottom: `1px solid ${C.accent}25` }}>
                  <div style={{ maxWidth: 1100, display: "flex", alignItems: "center", gap: 20, height: 44 }}>
                    <div style={{ padding: "3px 10px", border: `1px solid ${C.accent}`, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>{a.category}</div>
                    <div style={{ width: 1, height: 16, background: `${C.accent}40` }} />
                    <div style={{ fontSize: 10, color: C.warm, opacity: 0.6 }}>AABO-2025-{String(activeArticle + 1).padStart(3, "0")}</div>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontSize: 10, color: C.warm, opacity: 0.4 }}>{a.date} · {a.readTime}</div>
                  </div>
                </div>

                <article style={{ background: C.canvas }}>
                  {/* Article Header */}
                  <div style={{ padding: "64px 80px 48px", borderBottom: `1px solid ${C.mid}` }}>
                    <div style={{ maxWidth: 1100 }}>
                      <R><div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 80, alignItems: "end" }}>
                        <div>
                          <h1 style={{ fontFamily: T.h, fontSize: 44, fontWeight: 700, color: C.primary, margin: "0 0 20px 0", lineHeight: 1.15 }}>{a.title}</h1>
                          <p style={{ fontSize: 17, lineHeight: 1.7, color: C.text, opacity: 0.65, margin: 0, maxWidth: 560 }}>{a.excerpt}</p>
                        </div>
                        <div style={{ background: C.light, padding: "24px 20px", borderLeft: `3px solid ${C.accent}` }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 12, fontWeight: 600 }}>Document Summary</div>
                          {[
                            { l: "Type", v: a.category },
                            { l: "Published", v: a.date },
                            { l: "Reading Time", v: a.readTime },
                            { l: "Classification", v: "Advisory" },
                          ].map(r => (
                            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.mid}`, fontSize: 12 }}>
                              <span style={{ color: C.text, opacity: 0.45 }}>{r.l}</span>
                              <span style={{ color: C.primary, fontWeight: 600 }}>{r.v}</span>
                            </div>
                          ))}
                        </div>
                      </div></R>
                    </div>
                  </div>

                  {/* Article Body */}
                  <div style={{ padding: "56px 80px 100px" }}>
                    <div style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr 300px", gap: 80, alignItems: "start" }}>
                      <div>
                        {paragraphs.map((p, i) => (
                          <R key={i} delay={0.03 * Math.min(i, 6)}>
                            {i === 0 ? (
                              <p style={{ fontSize: 17, lineHeight: 1.9, color: C.text, margin: "0 0 28px 0", opacity: 0.85 }}>
                                <span style={{ fontFamily: T.h, fontSize: 48, float: "left", lineHeight: 0.8, marginRight: 12, marginTop: 4, color: C.accent }}>{p.charAt(0)}</span>
                                {p.slice(1)}
                              </p>
                            ) : (
                              <p style={{ fontSize: 15, lineHeight: 1.9, color: C.text, margin: "0 0 24px 0", opacity: 0.78 }}>{p}</p>
                            )}
                          </R>
                        ))}
                      </div>

                      {/* Sidebar */}
                      <div style={{ position: "sticky", top: 120 }}>
                        <R delay={0.2}><div style={{ marginBottom: 40 }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Key Takeaway</div>
                          <div style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: 20 }}>
                            <p style={{ fontFamily: T.h, fontSize: 16, lineHeight: 1.6, color: C.primary, margin: 0, fontStyle: "italic" }}>{a.excerpt}</p>
                          </div>
                        </div></R>

                        <R delay={0.3}><div style={{ background: C.primary, padding: "28px 24px" }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Continue Reading</div>
                          {ARTICLES.filter((_, idx) => idx !== activeArticle).map((other, i) => (
                            <div
                              key={i}
                              onClick={() => openArticle(ARTICLES.indexOf(other))}
                              style={{ padding: "12px 0", borderTop: `1px solid ${C.canvas}10`, cursor: "pointer" }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              <div style={{ fontSize: 9, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{other.category}</div>
                              <div style={{ fontSize: 13, color: C.canvas, lineHeight: 1.4, fontWeight: 500 }}>{other.title}</div>
                            </div>
                          ))}
                        </div></R>
                      </div>
                    </div>
                  </div>
                </article>
              </>
            );
          })()
        )}

        {/* FOOTER */}
        <footer style={{ padding: "36px 80px", background: C.primary, borderTop: `1px solid ${C.canvas}08` }}>
          <div style={{ maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: T.h, fontSize: 14, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
              <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Advisory</span>
            </div>
            <div style={{ fontSize: 11, color: C.warm, opacity: 0.25 }}>Sovereign-grade real estate advisory for diplomatic missions in global capitals.</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

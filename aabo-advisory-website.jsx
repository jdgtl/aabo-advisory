import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   AABO ADVISORY — Website
   Editorial Classic Layout · Midnight Protocol
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

function R({ children, delay = 0, dir = "up", style = {} }) {
  const [ref, v] = useReveal();
  const off = {
    up: "translateY(32px)", down: "translateY(-32px)",
    left: "translateX(32px)", right: "translateX(-32px)", none: "none",
  };
  return (
    <div ref={ref} style={{
      ...style,
      opacity: v ? 1 : 0,
      transform: v ? "none" : off[dir],
      transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function LineReveal({ w = 48, style = {} }) {
  const [ref, v] = useReveal(0.2);
  return (
    <div ref={ref} style={{
      height: 1.5, background: C.accent,
      width: v ? w : 0,
      transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
      ...style,
    }} />
  );
}

/* ───────── HOVER PRIMITIVES ───────── */
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

function HCard({ children, style, hs = {} }) {
  const [h, sH] = useState(false);
  return (
    <div
      onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{ ...style, ...(h ? hs : {}), transition: "all .35s cubic-bezier(.4,0,.2,1)" }}
    >
      {children}
    </div>
  );
}

/* ───────── SHARED DATA ───────── */
const APPROACH = [
  { title: "Long-Term Lens", text: "Diplomatic housing decisions are rarely short-term. We evaluate real estate through a multi-decade horizon, accounting for cost, risk, continuity, and asset value.", keyword: "Horizon" },
  { title: "Dual Audience", text: "We work with both headquarters and local missions, ensuring alignment between strategic objectives and on-the-ground realities.", keyword: "Alignment" },
  { title: "Discretion & Precision", text: "Our advisory work is deliberate, analytical, and discreet. We prioritize clarity over speed and outcomes over volume.", keyword: "Clarity" },
];

const PILLARS = [
  { num: "I", title: "Strategic Housing Advisory", items: ["Rent vs. buy analysis", "Portfolio strategy", "Financial modeling & policy support", "Long-term planning for staff housing"], note: "Portfolio Performance and Optimization" },
  { num: "II", title: "Transaction & Representation", items: ["Acquisition, Disposals, Leasing", "New development and off-market sourcing", "Negotiation and execution", "Closing oversight and risk mitigation"], note: "Full Cycle Transaction Management" },
  { num: "III", title: "Operational Stewardship", items: ["Post-closing oversight", "Vendor and issue coordination", "Ongoing asset performance monitoring", "Market-stats & Insights"], note: "Pro-active, On-going Support" },
];

const ARTICLES = [
  {
    category: "Strategic Whitepaper", title: "A 30-Year View on Diplomatic Housing in New York",
    excerpt: "Why diplomatic housing decisions deserve the same rigor applied to any long-term sovereign asset.",
    date: "February 2025", readTime: "12 min read",
    body: `Diplomatic housing is not a line item. It is infrastructure — as consequential to a mission's long-term viability as the embassy building itself.\n\nYet in most capitals, housing decisions for diplomatic staff are made reactively: leases renewed under time pressure, purchases deferred due to budget cycle constraints, and portfolios assembled without a coherent strategy. The result is a patchwork of commitments that serves neither headquarters nor the personnel who live in these spaces.\n\nThis paper argues for a fundamental reframing. Diplomatic housing should be evaluated through a 30-year lens — the same horizon applied to sovereign infrastructure, embassy construction, and long-term asset planning.\n\nThe rationale is straightforward. Missions are permanent. Staff rotate, but the institution endures. A housing portfolio built around short-term leases creates recurring exposure to market volatility, landlord discretion, and operational disruption. Ownership — pursued strategically — can eliminate these risks while building equity that compounds over decades.\n\nConsider the arithmetic. A diplomatic mission leasing ten apartments in Manhattan at current market rates will spend approximately $45–60 million over 30 years, adjusted for rent escalation. That capital is non-recoverable. An equivalent portfolio of owned units, acquired strategically over a 5–7 year period, would cost $25–35 million in acquisition, with maintenance and carrying costs well below cumulative lease obligations.\n\nThe financial case is compelling. But the operational case may be stronger.\n\nOwned housing provides continuity. Incoming staff arrive to maintained, familiar residences. There is no lease negotiation, no broker involvement, no risk of displacement. The mission controls its environment — a meaningful consideration for personnel operating far from home in high-cost cities.\n\nOwnership also creates institutional memory. A well-maintained portfolio becomes part of the mission's infrastructure, managed with the same discipline applied to the chancery itself.\n\nThe barriers are real but navigable. Procurement timelines, budget approval processes, and political sensitivities around sovereign property acquisition all require careful management. But these are process challenges, not structural ones. With proper advisory support, they can be addressed within existing frameworks.\n\nThe question is not whether diplomatic missions should own housing. It is whether they can afford — operationally, financially, and strategically — not to.`,
  },
  {
    category: "Field Guide", title: "Pre-Closing Walk-Throughs in New Developments",
    excerpt: "A practical playbook for evaluating new development units before closing — tailored for mission procurement officers.",
    date: "January 2025", readTime: "8 min read",
    body: `The final walk-through is not a formality. For diplomatic missions acquiring new development units, it is the last opportunity to verify that the property meets contractual specifications before title transfers and leverage diminishes.\n\nThis guide provides a structured framework for mission procurement officers conducting pre-closing inspections in New York City new developments.\n\nThe stakes are particular to diplomatic buyers. Unlike individual purchasers, missions often acquire multiple units simultaneously, manage procurement through committee processes, and must document condition thoroughly for institutional records. A missed deficiency can become a multi-year remediation effort complicated by diplomatic protocols.\n\nBegin with the offering plan. Every new development unit in New York is sold pursuant to an offering plan filed with the Attorney General's office. This document specifies finishes, fixtures, appliance models, dimensions, and material specifications. It is the contractual baseline against which the delivered unit must be measured.\n\nBring the plan to the walk-through. Compare every specified element against what has been installed. Discrepancies — even minor ones — should be documented photographically and noted on the punch list.\n\nStructure your inspection systematically. Move room by room, starting with the entry. Check door hardware, hinges, and alignment. Test every light switch and outlet. Run all faucets simultaneously to test water pressure. Flush toilets. Open and close every window. Operate all appliances through a complete cycle.\n\nPay particular attention to finishes. New development units frequently present with cosmetic deficiencies: paint imperfections, tile alignment issues, countertop chips, cabinet door misalignment. These are correctable but must be identified before closing.\n\nDocument everything. Use a standardized checklist. Photograph each deficiency with a reference marker for scale. Note the date, unit number, and inspector on every form.\n\nThe developer's representative will typically accompany you. Be courteous but thorough. Do not allow time pressure to abbreviate your inspection. You are protecting sovereign assets.`,
  },
  {
    category: "Quiet Insight", title: "Why Ownership Can Create a Sovereign Advantage",
    excerpt: "How shifting from leasing to ownership can reduce long-term costs and create institutional continuity.",
    date: "December 2024", readTime: "5 min read",
    body: `There is a quiet shift happening in how diplomatic missions approach real estate in major capitals. The conversation is moving from "Where do we lease?" to "What should we own?"\n\nThis is not a new idea. Several missions have maintained owned portfolios for decades. But the current market environment — characterized by elevated rents, constrained supply, and favorable long-term interest rate projections — is making the ownership conversation more urgent.\n\nThe sovereign advantage of ownership is threefold.\n\nFirst, cost control. Owned assets remove exposure to landlord-driven rent increases, which in New York have averaged 3–5% annually over the past two decades. Over a 20-year horizon, the cumulative savings are substantial.\n\nSecond, operational continuity. Diplomatic staff rotate on 3–4 year cycles. Each rotation in a leased portfolio triggers a cascade of logistics: lease renewals, potential relocations, broker engagement, and transition costs. Owned units eliminate this friction entirely.\n\nThird, institutional presence. Ownership signals permanence. It communicates to host governments, to staff, and to the mission's own organizational culture that the institution is invested — literally — in its long-term presence.\n\nThe transition need not be abrupt. A phased acquisition strategy, targeting 2–3 units annually over a 5-year period, can build a meaningful portfolio without straining a single budget cycle.\n\nThe question for mission leadership is straightforward: Is your current leasing strategy serving the institution's 30-year interests, or merely solving this year's housing problem?`,
  },
];

/* ───────── SHARED UI ───────── */
const Label = ({ text }) => (
  <div style={{
    fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
    color: C.accent, marginBottom: 14, fontWeight: 500,
  }}>
    {text}
  </div>
);

const DivLine = () => (
  <div style={{ display: "flex", alignItems: "center", padding: "0 80px", background: C.canvas }}>
    <div style={{ flex: 1, height: 1, background: C.mid }} />
    <div style={{ width: 5, height: 5, background: C.accent, transform: "rotate(45deg)", margin: "0 20px" }} />
    <div style={{ flex: 1, height: 1, background: C.mid }} />
  </div>
);

/* ───────── CONTACT MODAL ───────── */
function ContactModal({ onClose }) {
  const [form, setForm] = useState({ name: "", org: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const inputStyle = {
    width: "100%", padding: "14px 16px", fontSize: 14, fontFamily: T.b,
    background: C.light, border: `1px solid ${C.mid}`, color: C.text,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.25s ease",
  };
  const labelStyle = {
    fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
    color: C.text, opacity: 0.5, marginBottom: 6, display: "block", fontWeight: 500,
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: `${C.primary}CC`, backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.canvas, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto", position: "relative",
      }}>
        <div style={{ padding: "36px 40px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent, marginBottom: 8, fontWeight: 600 }}>Contact</div>
              <h2 style={{ fontFamily: T.h, fontSize: 28, fontWeight: 700, color: C.primary, margin: 0, lineHeight: 1.2 }}>Schedule a Consultation</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.text, opacity: 0.3, padding: "4px 8px", lineHeight: 1 }}>×</button>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: C.text, opacity: 0.55, margin: "12px 0 0 0" }}>We respond within one business day.</p>
        </div>

        {!submitted ? (
          <div style={{ padding: "28px 40px 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input value={form.name} onChange={set("name")} placeholder="Full name" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.mid} />
              </div>
              <div>
                <label style={labelStyle}>Organization</label>
                <input value={form.org} onChange={set("org")} placeholder="Mission or entity" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.mid} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input value={form.email} onChange={set("email")} type="email" placeholder="your@email.com" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.mid} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Message</label>
              <textarea value={form.message} onChange={set("message")} rows={4} placeholder="Brief description of your inquiry" style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.mid} />
            </div>
            <HBtn onClick={() => setSubmitted(true)}
              style={{ width: "100%", background: C.primary, color: C.canvas, border: "none", padding: "16px 32px", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: T.b, fontWeight: 500 }}
              hBg={C.accent} hCol={C.primary}>Submit Inquiry</HBtn>
          </div>
        ) : (
          <div style={{ padding: "48px 40px 56px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 20, color: C.accent }}>✓</div>
            <h3 style={{ fontFamily: T.h, fontSize: 22, fontWeight: 700, color: C.primary, margin: "0 0 10px 0" }}>Thank You</h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: C.text, opacity: 0.6, margin: "0 0 28px 0" }}>We have received your inquiry and will respond within one business day.</p>
            <HBtn onClick={onClose}
              style={{ background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, padding: "12px 32px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: T.b, fontWeight: 500 }}
              hBg={C.primary} hCol={C.canvas}>Close</HBtn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── FOOTER ───────── */
function Footer({ onContact, scrollTo }) {
  const footerLinks = [
    { label: "Approach", id: "approach" },
    { label: "Advisory", id: "services" },
    { label: "Insights", id: "insights" },
    { label: "About", id: "about" },
  ];
  return (
    <>
      <section style={{ padding: "72px 80px", background: C.primary, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${C.secondary}55 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: T.h, fontSize: 30, fontWeight: 700, color: C.canvas, margin: "0 0 14px 0" }}>Begin a Conversation</h2>
          <p style={{ fontSize: 14, color: C.warm, margin: "0 auto 32px", opacity: 0.6, maxWidth: 380, lineHeight: 1.7 }}>We advise quietly, plan across decades, and measure success by stability, continuity, and outcomes over time.</p>
          <HBtn onClick={onContact} style={{ background: "transparent", color: C.canvas, border: `1px solid ${C.accent}`, padding: "14px 44px", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", fontFamily: T.b, fontWeight: 500 }} hBg={C.accent} hCol={C.primary}>Schedule a Consultation</HBtn>
        </div>
      </section>

      <footer style={{ padding: "48px 80px 40px", background: C.primary, borderTop: `1px solid ${C.canvas}08` }}>
        <div style={{ maxWidth: 1100, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 60, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: T.h, fontSize: 16, fontWeight: 700, color: C.canvas, letterSpacing: "0.08em" }}>AABO</span>
              <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Advisory</span>
            </div>
            <p style={{ fontSize: 12, color: C.warm, opacity: 0.35, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>Sovereign-grade real estate advisory for diplomatic missions in global capitals.</p>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 14, fontWeight: 600 }}>Navigate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {footerLinks.map((l) => (
                <HBtn key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.canvas, opacity: 0.5, fontFamily: T.b, padding: 0, textAlign: "left" }}
                  hCol={C.accent}>{l.label}</HBtn>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 14, fontWeight: 600 }}>Connect</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <HBtn onClick={onContact}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.canvas, opacity: 0.5, fontFamily: T.b, padding: 0, textAlign: "left" }}
                hCol={C.accent}>Schedule a Consultation</HBtn>
              <span style={{ fontSize: 13, color: C.canvas, opacity: 0.5 }}>New York, NY</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid ${C.canvas}08`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.warm, opacity: 0.25 }}>© {new Date().getFullYear()} Aabo Advisory</div>
          <div style={{ fontSize: 11, color: C.warm, opacity: 0.25 }}>Discretion · Precision · Stewardship</div>
        </div>
      </footer>
    </>
  );
}

/* ───────── NAV ───────── */
function Nav({ scrollTo, activeSection, scrolled, onBack, isContent, onContact }) {
  const navItems = isContent
    ? [{ id: "back", label: "← All Insights" }]
    : [
        { id: "home", label: "Home" },
        { id: "approach", label: "Approach" },
        { id: "services", label: "Advisory" },
        { id: "insights", label: "Insights" },
        { id: "about", label: "About" },
      ];

  return (
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
        }} onClick={() => isContent ? onBack() : scrollTo("home")}>AABO</span>
        <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 500 }}>Advisory</span>
      </div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {navItems.map((item) => (
          <HBtn key={item.id}
            onClick={() => item.id === "back" ? onBack() : scrollTo(item.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, letterSpacing: "0.06em",
              color: activeSection === item.id ? C.accent : C.text,
              fontWeight: activeSection === item.id ? 600 : 400,
              fontFamily: T.b, padding: "4px 0",
              borderBottom: activeSection === item.id ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
            }}
            hCol={C.accent}>{item.label}</HBtn>
        ))}
        <HBtn onClick={onContact} style={{
          background: C.primary, color: C.canvas, border: "none",
          padding: "10px 22px", fontSize: 11, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer", fontFamily: T.b, fontWeight: 500,
        }} hBg={C.secondary}>Schedule a Consultation</HBtn>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════
   DOSSIER CONTENT VIEW
   ══════════════════════════════════════════════════════════ */
function DossierContent({ article, onBack, scrolled, onContact }) {
  const a = ARTICLES[article];
  const paragraphs = a.body.split("\n\n");

  const scrollTo = () => {};

  return (
    <>
      <Nav scrollTo={scrollTo} activeSection="" scrolled={scrolled} onBack={onBack} isContent onContact={onContact} />
      <div style={{ background: C.primary, padding: "0 80px", borderBottom: `1px solid ${C.accent}25` }}>
        <div style={{ maxWidth: 1100, display: "flex", alignItems: "center", gap: 20, height: 44 }}>
          <div style={{ padding: "3px 10px", border: `1px solid ${C.accent}`, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>{a.category}</div>
          <div style={{ width: 1, height: 16, background: `${C.accent}40` }} />
          <div style={{ fontSize: 10, color: C.warm, opacity: 0.6 }}>AABO-2025-{String(article + 1).padStart(3, "0")}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: C.warm, opacity: 0.4 }}>{a.date} · {a.readTime}</div>
        </div>
      </div>
      <article style={{ background: C.canvas }}>
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
            <div style={{ position: "sticky", top: 120 }}>
              <R delay={0.2}><div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Key Takeaway</div>
                <div style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: 20 }}>
                  <p style={{ fontFamily: T.h, fontSize: 16, lineHeight: 1.6, color: C.primary, margin: 0, fontStyle: "italic" }}>{a.excerpt}</p>
                </div>
              </div></R>
              <R delay={0.3}><div style={{ background: C.primary, padding: "28px 24px" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 16, fontWeight: 600 }}>Continue Reading</div>
                {ARTICLES.filter((_, idx) => idx !== article).map((other, i) => (
                  <div key={i} style={{ padding: "12px 0", borderTop: `1px solid ${C.canvas}10` }}>
                    <div style={{ fontSize: 9, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{other.category}</div>
                    <div style={{ fontSize: 13, color: C.canvas, lineHeight: 1.4, fontWeight: 500 }}>{other.title}</div>
                  </div>
                ))}
              </div></R>
            </div>
          </div>
        </div>
      </article>
      <Footer onContact={onContact} scrollTo={scrollTo} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════════ */
export default function AaboAdvisory() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [viewArticle, setViewArticle] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (fontsLoaded) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap";
    document.head.appendChild(link);
    setFontsLoaded(true);
  }, []);

  useEffect(() => {
    const container = document.getElementById("main-scroll");
    if (!container) return;
    const handleScroll = () => {
      setScrolled(container.scrollTop > 50);
      if (viewArticle !== null) return;
      const sections = ["home", "approach", "services", "insights", "about"];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top < 200) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [viewArticle]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const openArticle = (idx) => {
    setViewArticle(idx);
    setTimeout(() => {
      const el = document.getElementById("main-scroll");
      if (el) el.scrollTop = 0;
    }, 50);
  };
  const closeArticle = () => {
    setViewArticle(null);
    setTimeout(() => {
      const el = document.getElementById("insights");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const onContact = () => setContactOpen(true);

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", fontFamily: T.b, color: C.text, background: C.canvas }}>
      <div id="main-scroll" style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", scrollBehavior: "smooth" }}>
        {viewArticle !== null ? (
          <DossierContent article={viewArticle} onBack={closeArticle} scrolled={scrolled} onContact={onContact} />
        ) : (
          <>
            {/* NAV */}
            <Nav scrollTo={scrollTo} activeSection={activeSection} scrolled={scrolled} onContact={onContact} />

            {/* HERO */}
            <section id="home" style={{
              minHeight: "85vh", display: "flex", flexDirection: "column",
              justifyContent: "center", padding: "80px 80px 100px",
              position: "relative", background: C.canvas, overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 60, right: 80, width: 320, height: 320, border: `1px solid ${C.accent}15`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 100, right: 120, width: 240, height: 240, border: `1px solid ${C.accent}10`, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ maxWidth: 800, position: "relative", zIndex: 1 }}>
                <LineReveal style={{ marginBottom: 40 }} />
                <R><h1 style={{ fontFamily: T.h, fontSize: 54, fontWeight: 700, lineHeight: 1.12, color: C.primary, margin: "0 0 28px 0" }}>Real Estate Advisory<br />for Diplomatic Missions</h1></R>
                <R delay={0.1}><p style={{ fontSize: 19, lineHeight: 1.65, color: C.warm, maxWidth: 560, margin: "0 0 20px 0" }}>Strategic housing, acquisition, and long-term stewardship in global capitals.</p></R>
                <R delay={0.2}><p style={{ fontSize: 15, lineHeight: 1.75, color: C.text, maxWidth: 540, margin: "0 0 48px 0", opacity: 0.7 }}>We advise diplomatic, foreign and private organizations on real estate decisions in New York, helping balance financial responsibility, operational needs, and long-term presence.</p></R>
                <R delay={0.3}><HBtn onClick={onContact} style={{
                  background: "transparent", color: C.primary,
                  border: `1.5px solid ${C.primary}`, padding: "16px 40px",
                  fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: T.b, fontWeight: 500,
                }} hBg={C.primary} hCol={C.canvas}>Schedule a Consultation</HBtn></R>
              </div>
            </section>

            <DivLine />

            {/* APPROACH */}
            <section id="approach" style={{ padding: "100px 80px", background: C.light }}>
              <div style={{ maxWidth: 1100 }}>
                <R><Label text="Approach" /></R>
                <R delay={0.1}><h2 style={{ fontFamily: T.h, fontSize: 36, fontWeight: 700, color: C.primary, margin: "0 0 56px 0", lineHeight: 1.2 }}>Deliberate. Analytical. Discreet.</h2></R>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 36 }}>
                  {APPROACH.map((item, i) => (
                    <R key={item.keyword} delay={0.1 * i} style={{ height: "100%" }}>
                      <HCard style={{
                        padding: "40px 32px", background: C.canvas,
                        borderLeft: `3px solid ${C.accent}`, cursor: "default",
                        height: "100%", boxSizing: "border-box",
                      }} hs={{ transform: "translateY(-4px)", boxShadow: `0 8px 32px ${C.primary}10` }}>
                        <h3 style={{ fontFamily: T.h, fontSize: 21, fontWeight: 700, color: C.primary, margin: "0 0 14px 0" }}>{item.title}</h3>
                        <p style={{ fontSize: 14, lineHeight: 1.75, color: C.text, margin: 0, opacity: 0.75 }}>{item.text}</p>
                      </HCard>
                    </R>
                  ))}
                </div>
              </div>
            </section>

            {/* ADVISORY SERVICES */}
            <section id="services" style={{ padding: "100px 80px", background: C.primary, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${C.secondary}88 0%, transparent 60%)`, pointerEvents: "none" }} />
              <div style={{ maxWidth: 1100, position: "relative", zIndex: 1 }}>
                <R><Label text="Advisory Services" /></R>
                <R delay={0.1}><h2 style={{ fontFamily: T.h, fontSize: 36, fontWeight: 700, color: C.canvas, margin: "0 0 14px 0" }}>Three Pillars of Advisory</h2></R>
                <R delay={0.15}><p style={{ fontSize: 15, color: C.warm, maxWidth: 520, lineHeight: 1.7, margin: "0 0 56px 0", opacity: 0.8 }}>Our work spans the full lifecycle of diplomatic real estate — from strategic planning through acquisition to ongoing stewardship.</p></R>
                {PILLARS.map((p, pi) => (
                  <R key={p.num} delay={0.08 * pi}>
                    <HCard style={{
                      display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 40,
                      padding: "40px 0", borderTop: `1px solid ${C.canvas}12`,
                      alignItems: "start", cursor: "default",
                    }} hs={{ background: `${C.canvas}06`, paddingLeft: 16, paddingRight: 16, borderRadius: 4 }}>
                      <div style={{ fontFamily: T.h, fontSize: 28, color: C.accent }}>{p.num}</div>
                      <div>
                        <h3 style={{ fontFamily: T.h, fontSize: 23, fontWeight: 700, margin: "0 0 8px 0", color: C.canvas }}>{p.title}</h3>
                        <p style={{ fontSize: 13, color: C.accent, fontStyle: "italic", margin: 0, opacity: 0.8 }}>{p.note}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {p.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 14, color: C.canvas, opacity: 0.75, lineHeight: 1.5 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 7 }} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </HCard>
                  </R>
                ))}
              </div>
            </section>

            {/* INSIGHTS */}
            <section id="insights" style={{ padding: "100px 80px", background: C.canvas }}>
              <div style={{ maxWidth: 1100 }}>
                <R><Label text="Insights" /></R>
                <R delay={0.1}><h2 style={{ fontFamily: T.h, fontSize: 36, fontWeight: 700, color: C.primary, margin: "0 0 14px 0" }}>Perspectives & Field Guides</h2></R>
                <R delay={0.15}><p style={{ fontSize: 15, color: C.text, opacity: 0.6, maxWidth: 480, lineHeight: 1.7, margin: "0 0 52px 0" }}>Strategic observations and practical guidance.</p></R>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                  {ARTICLES.map((a, i) => (
                    <R key={i} delay={0.1 * i} style={{ height: "100%" }}>
                      <HCard style={{
                        background: C.light, padding: "36px 30px",
                        borderBottom: `2px solid ${C.accent}`, cursor: "pointer",
                        display: "flex", flexDirection: "column", justifyContent: "space-between",
                        height: "100%", boxSizing: "border-box",
                      }} hs={{ transform: "translateY(-4px)", boxShadow: `0 12px 36px ${C.primary}08` }}>
                        <div onClick={() => openArticle(i)} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, marginBottom: 14, fontWeight: 600 }}>{a.category}</div>
                          <h3 style={{ fontFamily: T.h, fontSize: 19, fontWeight: 700, color: C.primary, margin: "0 0 12px 0", lineHeight: 1.35 }}>{a.title}</h3>
                          <p style={{ fontSize: 13, lineHeight: 1.7, color: C.text, margin: 0, opacity: 0.6 }}>{a.excerpt}</p>
                          <div style={{ marginTop: "auto", paddingTop: 20, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent, fontWeight: 500 }}>Read Briefing →</div>
                        </div>
                      </HCard>
                    </R>
                  ))}
                </div>
              </div>
            </section>

            {/* ABOUT */}
            <section id="about" style={{ padding: "100px 80px", background: C.light }}>
              <div style={{ maxWidth: 1100 }}>
                <div style={{ maxWidth: 680 }}>
                  <R><Label text="About" /></R>
                  <R delay={0.1}><h2 style={{ fontFamily: T.h, fontSize: 36, fontWeight: 700, color: C.primary, margin: "0 0 28px 0" }}>Confidence in Complexity</h2></R>
                  <R delay={0.15}><p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, margin: "0 0 20px 0", opacity: 0.8 }}>Our advisory practice grew out of years working with diplomatic missions, international organizations, and global clients navigating New York's real estate market.</p></R>
                  <R delay={0.2}><p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, margin: 0, opacity: 0.8 }}>We combine market expertise with an understanding of diplomatic process, institutional decision-making, and long-term stewardship — helping missions operate with confidence in one of the world's most complex cities.</p></R>
                </div>
              </div>
            </section>

            <Footer onContact={onContact} scrollTo={scrollTo} />
          </>
        )}
      </div>
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </div>
  );
}

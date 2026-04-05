import { useState } from "react";
import { Zap, Wrench, BarChart3, Bot, CheckCircle2, Building2, Users, CreditCard, FolderOpen, MessageSquare, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Logo from "../components/Logo";

const HERO_IMAGE = "https://media.base44.com/images/public/69d176412565789962328166/74bcfb124_Screenshot2026-04-05at22803AM.png";

const FEATURES = [
  { icon: Building2, title: "Property Management", desc: "Track every property, unit, and tenant in one place with full history and audit trails." },
  { icon: Wrench, title: "Maintenance Tracking", desc: "AI-triaged work orders, vendor assignments, and photo documentation built in." },
  { icon: CreditCard, title: "Payments & Financials", desc: "Log rent payments, split payments, generate financial reports, and track expenses." },
  { icon: Bot, title: "AI Lease Generator", desc: "Generate state-compliant lease agreements in seconds using your property data." },
  { icon: Zap, title: "Smart Automations", desc: "Set up automated reminders, notifications, and workflows — no code required." },
  { icon: FolderOpen, title: "Document Hub", desc: "Centralized document storage with AI categorization and tenant-facing access." },
];

const ROLES = [
  { title: "For Landlords", desc: "Manage properties, track rent, handle maintenance, and stay compliant — all from one dashboard." },
  { title: "For Tenants", desc: "Pay rent, submit maintenance requests, sign documents, and communicate with your landlord." },
  { title: "For Property Managers", desc: "Oversee multiple properties, assign team members, automate workflows, and generate reports." },
];

const PLANS = [
  { name: "Starter", price: "$0", units: "Up to 3 units", features: ["Property & tenant profiles", "Maintenance tracking", "Rent logging", "Document storage"], highlight: false, isEnterprise: false },
  { name: "Growth", price: "$29", units: "Up to 15 units", features: ["Everything in Starter", "AI lease generator", "Automated reminders", "Financial reports"], highlight: true, isEnterprise: false },
  { name: "Pro", price: "$79", units: "Up to 50 units", features: ["Everything in Growth", "Team members", "Smart automations", "Custom branding"], highlight: false, isEnterprise: false },
  { name: "Enterprise", price: "$299", units: "Unlimited", features: ["Everything in Pro", "White-label options", "Custom integrations", "Dedicated support"], highlight: false, isEnterprise: true },
];

const TILES = [
  { icon: Bot, label: "AI Lease Generator" },
  { icon: Wrench, label: "Maintenance Tracking" },
  { icon: BarChart3, label: "Financial Hub" },
  { icon: Zap, label: "Smart Automations" },
];

export default function LandingPage() {
  const handleLogin = () => base44.auth.redirectToLogin();
  const handleSignup = () => base44.auth.redirectToLogin();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ full_name: '', business_name: '', email: '', phone: '', units_count: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#F4F3FF", color: "#1A1A2E", overflowX: "hidden" }}>

      {/* Background blobs — both sides */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -150, left: -150, width: 600, height: 600, borderRadius: "50%", background: "rgba(124,111,205,0.18)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: -150, right: -150, width: 600, height: 600, borderRadius: "50%", background: "rgba(124,111,205,0.18)", filter: "blur(100px)" }} />
      </div>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124,111,205,0.12)", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Logo variant="horizontal" size="lg" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleLogin} style={{ padding: "8px 20px", borderRadius: 999, background: "#fff", border: "1px solid rgba(124,111,205,0.4)", color: "#7C6FCD", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Log In
          </button>
          <button onClick={handleSignup} style={{ padding: "8px 20px", borderRadius: 999, background: "#7C6FCD", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none" }}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: 620, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Hero bg image */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(13,15,20,0.45)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "80px 24px 60px", maxWidth: 720 }}>
          {/* Badge */}
          <div style={{ display: "inline-block", marginBottom: 20, padding: "5px 16px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600, fontSize: 13 }}>
            • Smarter Property Management
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 800, letterSpacing: "-1.5px", color: "#fff", lineHeight: 1.12, margin: "0 0 18px" }}>
            Property Management.<br />Simplified.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", marginBottom: 36, lineHeight: 1.7 }}>
            The all-in-one platform for landlords, property managers, and tenants.<br />Automate the boring. Focus on what matters.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleSignup} style={{ padding: "14px 32px", borderRadius: 999, background: "#7C6FCD", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", border: "none", boxShadow: "0 4px 20px rgba(124,111,205,0.35)" }}>
              Get Started Free
            </button>
            <button onClick={handleLogin} style={{ padding: "14px 32px", borderRadius: 999, background: "#fff", border: "1px solid rgba(124,111,205,0.4)", color: "#7C6FCD", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Log In
            </button>
          </div>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
            {["No credit card required", "14-day free trial", "Cancel anytime"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} color="#22C55E" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature tiles — single horizontal row */}
      <section style={{ background: "#F4F3FF", padding: "48px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 16, justifyContent: "center", flexWrap: "nowrap", overflowX: "auto" }}>
          {TILES.map((tile, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid rgba(124,111,205,0.18)", borderRadius: 16,
              padding: "20px 16px", textAlign: "center",
              boxShadow: "0 2px 16px rgba(124,111,205,0.08)",
              transform: `perspective(800px) rotateY(${i % 2 === 0 ? -3 : 3}deg) rotateX(2deg)`,
              transition: "transform 0.2s",
              flex: "0 0 170px", width: 170,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,111,205,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <tile.icon size={22} color="#7C6FCD" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#1A1A2E" }}>{tile.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ background: "#fff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7C6FCD", marginBottom: 10 }}>Everything you need</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#1A1A2E", marginBottom: 48, letterSpacing: "-0.5px" }}>Built for modern property management</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(124,111,205,0.12)", borderRadius: 16, padding: "24px", boxShadow: "0 2px 16px rgba(124,111,205,0.06)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,111,205,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <f.icon size={20} color="#7C6FCD" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1A1A2E", marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{ background: "#F4F3FF", padding: "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, color: "#1A1A2E", marginBottom: 40, letterSpacing: "-0.5px" }}>Built for everyone in the rental ecosystem</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {ROLES.map((r, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(124,111,205,0.12)", borderLeft: "4px solid #7C6FCD", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(124,111,205,0.07)" }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1A1A2E", marginBottom: 10 }}>{r.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: "#fff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7C6FCD", marginBottom: 10 }}>Pricing</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, color: "#1A1A2E", marginBottom: 48, letterSpacing: "-0.5px" }}>Simple, transparent pricing</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {PLANS.map((p, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 18, padding: "28px 22px",
                border: p.highlight ? "2px solid #7C6FCD" : "1px solid rgba(124,111,205,0.14)",
                boxShadow: p.highlight ? "0 0 32px rgba(124,111,205,0.18)" : "0 2px 12px rgba(124,111,205,0.05)",
                position: "relative",
              }}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "3px 14px", borderRadius: 999, background: "#7C6FCD", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A2E", marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#7C6FCD", marginBottom: 4 }}>{p.price}<span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>{p.price !== "Custom" ? "/mo" : ""}</span></p>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>{p.units}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, spaceY: 8 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <CheckCircle2 size={14} color="#22C55E" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={p.isEnterprise ? () => setContactOpen(true) : handleSignup} style={{
                  marginTop: 20, width: "100%", padding: "10px", borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: "pointer",
                  background: p.isEnterprise ? "#fff" : p.highlight ? "#7C6FCD" : "#fff",
                  color: p.isEnterprise ? "#7C6FCD" : p.highlight ? "#fff" : "#7C6FCD",
                  border: p.isEnterprise ? "2px solid #7C6FCD" : p.highlight ? "none" : "1px solid rgba(124,111,205,0.4)",
                }}>
                  {p.isEnterprise ? "Contact Us" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Modal */}
      {contactOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px", maxWidth: 500, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            {!contactSuccess ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", margin: 0 }}>Enterprise Plan Inquiry</h2>
                  <button onClick={() => setContactOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={24} color="#6B7280" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Full Name *</label>
                    <input type="text" placeholder="John Smith" value={contactForm.full_name} onChange={e => setContactForm(f => ({ ...f, full_name: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Business Name *</label>
                    <input type="text" placeholder="Your Company LLC" value={contactForm.business_name} onChange={e => setContactForm(f => ({ ...f, business_name: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Email Address *</label>
                    <input type="email" placeholder="john@company.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Phone Number *</label>
                    <input type="tel" placeholder="(555) 123-4567" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Approximate Number of Units *</label>
                    <input type="number" placeholder="50" value={contactForm.units_count} onChange={e => setContactForm(f => ({ ...f, units_count: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>Message or Specific Needs</label>
                    <textarea placeholder="Tell us about your needs..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(124,111,205,0.3)", fontSize: 14, boxSizing: "border-box", minHeight: 100, fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setContactOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: 999, background: "#fff", border: "1px solid rgba(124,111,205,0.4)", color: "#7C6FCD", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  <button onClick={async () => {
                    if (!contactForm.full_name || !contactForm.business_name || !contactForm.email || !contactForm.phone || !contactForm.units_count) {
                      alert("Please fill in all required fields");
                      return;
                    }
                    setContactSubmitting(true);
                    try {
                      const res = await base44.functions.invoke('submitEnterpriseInquiry', contactForm);
                      if (res.data?.success) {
                        setContactSuccess(true);
                      } else {
                        alert("Error submitting inquiry. Please try again.");
                      }
                    } catch (error) {
                      alert("Error submitting inquiry. Please try again.");
                      console.error(error);
                    }
                    setContactSubmitting(false);
                  }} disabled={contactSubmitting} style={{ flex: 1, padding: "12px", borderRadius: 999, background: "#7C6FCD", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}>Send Inquiry</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 size={32} color="#22C55E" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Thank You</h3>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>We will be in touch within 24 hours to discuss your Enterprise plan.</p>
                <button onClick={() => { setContactOpen(false); setContactSuccess(false); setContactForm({ full_name: '', business_name: '', email: '', phone: '', units_count: '', message: '' }); }} style={{ padding: "10px 24px", borderRadius: 999, background: "#7C6FCD", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none" }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: "#F4F3FF", borderTop: "1px solid rgba(124,111,205,0.15)", padding: "32px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <Logo variant="horizontal" size="sm" />
        </div>
        <p style={{ fontSize: 13, color: "#6B7280" }}>© {new Date().getFullYear()} iTenant. All rights reserved.</p>
      </footer>
    </div>
  );
}
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Zap, Wrench, BarChart3, Sparkles, Bot, CreditCard, FileText, Users, CheckCircle } from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop";

const features = [
  { icon: Sparkles, title: "AI Lease Generator", desc: "Generate state-compliant lease agreements in seconds with our AI engine." },
  { icon: CreditCard, title: "Rent Collection", desc: "Accept bank transfer, card, check, or money order with photo proof." },
  { icon: Wrench, title: "Maintenance Tracking", desc: "AI triages urgency and assigns vendors automatically." },
  { icon: BarChart3, title: "Financial Hub", desc: "Track income, expenses, and estimate taxes across your portfolio." },
  { icon: Zap, title: "Smart Automations", desc: "16 built-in presets for reminders, renewals, and move-ins." },
  { icon: Users, title: "Tenant Portal", desc: "Tenants pay rent, submit requests, and access documents in one place." },
];

const floating = [
  { icon: Bot, label: "AI Lease Generator" },
  { icon: Wrench, label: "Maintenance Tracking" },
  { icon: BarChart3, label: "Financial Hub" },
  { icon: Sparkles, label: "Smart Automations" },
];

const plans = [
  { name: "Starter", price: 29, units: "Up to 10 units", features: ["Tenant portal", "Maintenance tracking", "Basic automations", "Document storage"], popular: false, primary: true },
  { name: "Growth", price: 79, units: "Up to 50 units", features: ["Everything in Starter", "AI Lease Generator", "Financial Hub", "Priority support"], popular: true, primary: true },
  { name: "Pro", price: 149, units: "Up to 200 units", features: ["Everything in Growth", "Full AI suite", "Dedicated phone number", "Advanced reporting"], popular: false, primary: false },
  { name: "Enterprise", price: 299, units: "Unlimited units", features: ["Everything in Pro", "White label", "Custom integrations", "Dedicated support"], popular: false, primary: false },
];

const roles = [
  { title: "Landlords & Property Managers", desc: "Manage every property, unit, tenant, lease, and dollar from one dashboard." },
  { title: "Tenants", desc: "Pay rent, submit maintenance requests, message your landlord, and access all your documents." },
  { title: "Platform Owner", desc: "Full visibility into all clients, MRR, ARR, and platform health in real time." },
];

export default function LandingPage() {
  const goToAuth = () => base44.auth.redirectToLogin();

  return (
    <div style={{ backgroundColor: "#0D0F14", color: "#fff", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      {/* HEADER */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: "blur(16px)", backgroundColor: "rgba(13,15,20,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>iTenant</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={goToAuth} style={{ padding: "8px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            Log In
          </button>
          <button onClick={goToAuth} style={{ padding: "8px 20px", borderRadius: 999, background: "#7C6FCD", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Get Started
          </button>
        </div>
      </header>

      {/* HERO */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(13,15,20,0.85) 0%, rgba(13,15,20,0.97) 100%)",
        }} />
        <div style={{ position: "relative", textAlign: "center", padding: "0 24px", maxWidth: 780, width: "100%" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: "1px solid rgba(124,111,205,0.4)", backgroundColor: "rgba(124,111,205,0.1)",
            color: "#7C6FCD", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 500,
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C6FCD", display: "inline-block" }} />
            Smarter Property Management
          </div>
          <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 20px" }}>
            Property Management.<br />Simplified.
          </h1>
          <p style={{ fontSize: 18, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 36, maxWidth: 620, margin: "0 auto 36px" }}>
            The all-in-one platform for landlords, property managers, and tenants. Collect rent, manage maintenance, generate AI leases, and automate everything — from one place.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <button onClick={goToAuth} style={{ padding: "14px 32px", borderRadius: 999, background: "#7C6FCD", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
              Get Started Free
            </button>
            <button onClick={goToAuth} style={{ padding: "14px 32px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 500 }}>
              Log In
            </button>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {["✓ No credit card required", "✓ 14-day free trial", "✓ Cancel anytime"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#9CA3AF" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Floating tiles */}
        <div style={{
          position: "absolute", bottom: -48, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 16, padding: "0 24px", width: "100%", maxWidth: 900,
          justifyContent: "center", flexWrap: "wrap",
        }}>
          {floating.map(({ icon: Icon, label }) => (
            <div key={label} style={{
              background: "rgba(22,25,31,0.95)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "24px 28px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 12, minWidth: 160, flex: 1, maxWidth: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              transform: "perspective(600px) rotateX(4deg)",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,111,205,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color="#7C6FCD" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: "#fff" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ backgroundColor: "#0D0F14", padding: "140px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#7C6FCD", marginBottom: 12, textTransform: "uppercase" }}>Features</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em" }}>Everything you need to run your properties</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, padding: 28,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,111,205,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={22} color="#7C6FCD" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROLES */}
      <div style={{ backgroundColor: "#16191F", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48 }}>
            Built for everyone in the rental process
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {roles.map(({ title, desc }) => (
              <div key={title} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 20,
                borderLeft: "4px solid #7C6FCD", border: "1px solid rgba(255,255,255,0.08)",
                borderLeftWidth: 4, borderLeftColor: "#7C6FCD",
                padding: 28, display: "flex", flexDirection: "column", gap: 16,
              }}>
                <div style={{ borderLeft: "4px solid #7C6FCD", paddingLeft: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                </div>
                <button onClick={goToAuth} style={{
                  marginTop: "auto", padding: "10px 20px", borderRadius: 999, background: "#7C6FCD",
                  border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, alignSelf: "flex-start",
                }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{ backgroundColor: "#0D0F14", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48 }}>
            Simple, transparent pricing
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
            {plans.map(p => (
              <div key={p.name} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20, position: "relative",
                ...(p.popular ? { boxShadow: "0 0 0 2px #7C6FCD" } : {}),
              }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#7C6FCD", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 999, letterSpacing: "0.05em" }}>
                    MOST POPULAR
                  </div>
                )}
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</h3>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>${p.price}<span style={{ fontSize: 16, fontWeight: 400, color: "#9CA3AF" }}>/mo</span></div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{p.units}</div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#9CA3AF" }}>
                      <CheckCircle size={14} color="#22C55E" style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={goToAuth} style={{
                  padding: "12px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 600,
                  ...(p.primary
                    ? { background: "#7C6FCD", border: "none", color: "#fff" }
                    : { background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }),
                }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: "#16191F", borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "48px 40px 32px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={16} color="#fff" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 18 }}>iTenant</span>
              </div>
              <p style={{ color: "#9CA3AF", fontSize: 14 }}>Smarter property management for everyone.</p>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <button onClick={goToAuth} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 14, padding: 0 }}>Log In</button>
              <button onClick={goToAuth} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 14, padding: 0 }}>Get Started</button>
            </div>
          </div>
          <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}>
            © 2026 iTenant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
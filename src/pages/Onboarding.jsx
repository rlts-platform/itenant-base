import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", business_name: "", role: "" });

  const generateClientId = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let attempt = 0; attempt < 10; attempt++) {
      const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const candidate = `ITNT-${suffix}`;
      const existing = await base44.entities.Account.filter({ client_id: candidate });
      if (existing.length === 0) return candidate;
    }
    return `ITNT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!form.full_name || !form.business_name) return;
      setStep(2);
    } else if (step === 2) {
      if (!form.role) return;
      setLoading(true);
      try {
        const user = await base44.auth.me();
        const client_id = await generateClientId();
        const account = await base44.entities.Account.create({
          company_name: form.business_name,
          owner_email: user.email,
          client_id,
        });

        // Create or update app_users record
        const existing = await base44.entities.AppUser.filter({ user_email: user.email });
        if (existing.length === 0) {
          await base44.entities.AppUser.create({
            user_email: user.email,
            role: form.role,
            onboarding_complete: true,
            business_name: form.business_name,
            account_id: account.id,
          });
        } else {
          await base44.entities.AppUser.update(existing[0].id, {
            role: form.role,
            onboarding_complete: true,
            business_name: form.business_name,
            account_id: account.id,
          });
        }

        // Update user profile with name
        await base44.auth.updateMe({ full_name: form.full_name });

        // Redirect based on role
        navigate(form.role === "tenant" ? "/tenant" : "/");
      } catch (error) {
        console.error("Onboarding error:", error);
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#F4F3FF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(124,111,205,0.15)", padding: "50px 40px", maxWidth: 500, width: "100%", boxShadow: "0 8px 32px rgba(124,111,205,0.1)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 22, color: "#1A1A2E" }}>iTenant</span>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          <div style={{ height: 3, flex: 1, borderRadius: 999, background: step >= 1 ? "#7C6FCD" : "#E5E7EB", transition: "all 0.2s" }} />
          <div style={{ height: 3, flex: 1, borderRadius: 999, background: step >= 2 ? "#7C6FCD" : "#E5E7EB", transition: "all 0.2s" }} />
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Welcome to iTenant</h1>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>Let's set up your account. First, tell us about yourself.</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>Your Full Name</Label>
                <Input
                  className="mt-2"
                  placeholder="John Smith"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div>
                <Label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>Business / Company Name</Label>
                <Input
                  className="mt-2"
                  placeholder="Your Company LLC"
                  value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!form.full_name || !form.business_name}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 999,
                background: form.full_name && form.business_name ? "#7C6FCD" : "#E5E7EB",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                cursor: form.full_name && form.business_name ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Next <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>What's your role?</h1>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>Choose how you'll use iTenant.</p>
            </div>

            <div className="space-y-3">
              {[
                { value: "client", label: "Landlord / Property Manager", desc: "Manage properties, tenants, rent, and maintenance" },
                { value: "tenant", label: "Tenant / Renter", desc: "Pay rent, submit requests, view documents" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                  style={{
                    padding: "16px",
                    borderRadius: 14,
                    border: form.role === opt.value ? "2px solid #7C6FCD" : "1px solid rgba(124,111,205,0.2)",
                    background: form.role === opt.value ? "rgba(124,111,205,0.08)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A2E", marginBottom: 4 }}>{opt.label}</p>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>{opt.desc}</p>
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!form.role || loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 999,
                background: form.role ? "#7C6FCD" : "#E5E7EB",
                color: "#fff",
                fontWeight: 700,
                border: "none",
                cursor: form.role ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Complete Setup <ArrowRight size={16} /></>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
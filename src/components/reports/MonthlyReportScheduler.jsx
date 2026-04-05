import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Send, CheckCircle2, Clock, Calendar, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const card = {
  background: "#fff",
  border: "1px solid rgba(124,111,205,0.15)",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 2px 16px rgba(124,111,205,0.07)",
};

export default function MonthlyReportScheduler() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.full_name) setName(user.full_name);
    // Load last sent from localStorage
    const stored = localStorage.getItem("itenant_last_report_sent");
    if (stored) setLastSent(new Date(stored));
  }, [user]);

  const now = new Date();
  const currentMonth = now.toLocaleString("default", { month: "long", year: "numeric" });

  const sendNow = async () => {
    if (!email) return;
    setSending(true);
    setStatus(null);
    const res = await base44.functions.invoke("sendMonthlyReport", {
      recipient_email: email,
      recipient_name: name,
      month_label: currentMonth,
    });
    setSending(false);
    if (res.data?.success) {
      const now = new Date();
      setLastSent(now);
      localStorage.setItem("itenant_last_report_sent", now.toISOString());
      setPreview(res.data.summary);
      setStatus({ type: "success", msg: `Report sent to ${email}` });
    } else {
      setStatus({ type: "error", msg: res.data?.error || "Failed to send. Check your email address." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div style={{ ...card, background: "linear-gradient(135deg, rgba(124,111,205,0.08) 0%, rgba(124,111,205,0.04) 100%)", border: "1px solid rgba(124,111,205,0.2)" }}>
        <div className="flex items-start gap-4">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart3 size={20} color="#fff" />
          </div>
          <div className="flex-1">
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1A1A2E", marginBottom: 4 }}>Monthly Performance Reports</h3>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
              Automatically compiled report including rent collected, net cash flow, maintenance status, and occupancy rate — delivered to your inbox every month.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid rgba(124,111,205,0.12)" }}>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: "#7C6FCD" }} />
            <span style={{ fontSize: 13, color: "#6B7280" }}>Scheduled: <strong style={{ color: "#1A1A2E" }}>1st of every month</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "#7C6FCD" }} />
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              Last sent: <strong style={{ color: "#1A1A2E" }}>{lastSent ? lastSent.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Send now form */}
      <div style={card}>
        <h4 style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Send size={15} style={{ color: "#7C6FCD" }} /> Send Report Now
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label style={{ fontSize: 13, color: "#6B7280", marginBottom: 6, display: "block" }}>Recipient Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={{ background: "#fff", border: "1px solid rgba(124,111,205,0.3)", color: "#1A1A2E", borderRadius: 10 }}
            />
          </div>
          <div>
            <Label style={{ fontSize: 13, color: "#6B7280", marginBottom: 6, display: "block" }}>Email Address *</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="landlord@example.com"
              style={{ background: "#fff", border: "1px solid rgba(124,111,205,0.3)", color: "#1A1A2E", borderRadius: 10 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={sendNow}
            disabled={sending || !email}
            style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none", opacity: (!email || sending) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6, padding: "8px 20px" }}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {sending ? "Sending…" : `Send ${currentMonth} Report`}
          </Button>
          {status && (
            <div className="flex items-center gap-2" style={{ fontSize: 13, color: status.type === "success" ? "#22C55E" : "#EF4444" }}>
              <CheckCircle2 size={14} />
              {status.msg}
            </div>
          )}
        </div>
      </div>

      {/* Preview of last sent summary */}
      {preview && (
        <div style={card}>
          <h4 style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} color="#22C55E" /> Last Report Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rent Collected", value: `$${Number(preview.rentCollected).toLocaleString()}`, color: "#22C55E" },
              { label: "Net Cash Flow", value: `$${Number(preview.netCashFlow).toLocaleString()}`, color: preview.netCashFlow >= 0 ? "#22C55E" : "#EF4444" },
              { label: "Occupancy", value: `${preview.occupancyRate}%`, color: "#7C6FCD" },
              { label: "Open Work Orders", value: preview.openOrders, color: preview.openOrders > 0 ? "#F59E0B" : "#22C55E" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#F4F3FF", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(124,111,205,0.1)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#7C6FCD", marginBottom: 4 }}>{m.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule info */}
      <div style={{ ...card, background: "#F4F3FF", border: "1px solid rgba(124,111,205,0.1)" }}>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} style={{ color: "#7C6FCD", flexShrink: 0 }} />
          Reports are automatically scheduled to send on the <strong style={{ color: "#1A1A2E" }}>1st of each month at 8:00 AM</strong>. Use "Send Now" above to trigger an immediate report at any time.
        </p>
      </div>
    </div>
  );
}
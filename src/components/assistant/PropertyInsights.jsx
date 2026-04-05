import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, AlertTriangle, Home, Loader2, RefreshCw, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const cardStyle = {
  background: "#fff",
  border: "1px solid rgba(124,111,205,0.15)",
  borderRadius: 16,
  padding: "20px 22px",
  boxShadow: "0 2px 12px rgba(124,111,205,0.07)",
};

function InsightCard({ icon: Icon, color, label, items, emptyMsg }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={cardStyle}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: expanded ? 16 : 0 }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1A2E", flex: 1, textAlign: "left" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#9CA3AF", marginRight: 4 }}>{items?.length || 0}</span>
        {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!items || items.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>{emptyMsg}</p>
          ) : items.map((item, i) => (
            <div key={i} style={{ background: "#F4F3FF", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(124,111,205,0.1)" }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", margin: "0 0 5px" }}>{item.property}</p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 8px", lineHeight: 1.55 }}>{item.insight}</p>
              {item.recommendation && (
                <div style={{ background: "#fff", border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommendation</p>
                  <p style={{ fontSize: 13, color: "#1A1A2E", margin: 0, lineHeight: 1.5 }}>{item.recommendation}</p>
                </div>
              )}
              {item.risk_level && (
                <span style={{
                  display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: item.risk_level === "high" ? "#FEE2E2" : item.risk_level === "medium" ? "#FEF3C7" : "#F0FDF4",
                  color: item.risk_level === "high" ? "#EF4444" : item.risk_level === "medium" ? "#F59E0B" : "#22C55E",
                }}>
                  {item.risk_level.toUpperCase()} RISK
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const analyze = async () => {
    setLoading(true);
    setInsights(null);

    const [properties, units, leases, payments, orders] = await Promise.all([
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
      base44.entities.Lease.list(),
      base44.entities.Payment.list("-date"),
      base44.entities.WorkOrder.list("-created_date"),
    ]);

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Build per-property data summaries
    const propData = properties.map(prop => {
      const propUnits = units.filter(u => u.property_id === prop.id);
      const activeLeases = leases.filter(l => l.status === "active" && propUnits.some(u => u.id === l.unit_id));
      const occupiedUnitIds = new Set(activeLeases.map(l => l.unit_id));
      const vacantUnits = propUnits.filter(u => !occupiedUnitIds.has(u.id));
      const tenantIds = new Set(activeLeases.map(l => l.tenant_id));

      // Recent payments
      const recentPayments = payments.filter(p =>
        tenantIds.has(p.tenant_id) && new Date(p.date) >= sixMonthsAgo
      );
      const confirmedPayments = recentPayments.filter(p => p.status === "confirmed");
      const pendingOrFailed = recentPayments.filter(p => p.status !== "confirmed");
      const totalCollected = confirmedPayments.reduce((s, p) => s + (p.amount || 0), 0);

      // Maintenance
      const propOrders = orders.filter(o => o.property_id === prop.id || propUnits.some(u => u.id === o.unit_id));
      const openOrders = propOrders.filter(o => o.status !== "closed");
      const maintenanceCost = propOrders.filter(o => o.cost && new Date(o.created_date) >= sixMonthsAgo).reduce((s, o) => s + (o.cost || 0), 0);

      // Expiring leases
      const expiringLeases = activeLeases.filter(l => {
        if (!l.end_date) return false;
        const end = new Date(l.end_date);
        const daysUntil = (end - now) / 86400000;
        return daysUntil >= 0 && daysUntil <= 90;
      });

      const avgRent = propUnits.filter(u => u.rent_amount).reduce((s, u, _, a) => s + u.rent_amount / a.length, 0);

      return {
        name: prop.nickname || prop.address,
        total_units: propUnits.length,
        occupied_units: propUnits.length - vacantUnits.length,
        vacant_units: vacantUnits.length,
        avg_rent: Math.round(avgRent),
        rent_6mo_collected: totalCollected,
        late_or_failed_payments: pendingOrFailed.length,
        open_work_orders: openOrders.length,
        maintenance_cost_6mo: maintenanceCost,
        expiring_leases_90d: expiringLeases.length,
        state: prop.state || "",
      };
    });

    if (propData.length === 0) {
      setInsights({ error: "No properties found. Add properties and data first." });
      setLoading(false);
      return;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are a professional property management analyst. Analyze the following portfolio data and return structured insights.

PORTFOLIO DATA (last 6 months):
${JSON.stringify(propData, null, 2)}

Return three arrays of insights:
1. rental_rate_recommendations: For each property, evaluate if the rent is likely too low/high based on occupancy, payment history, and vacancy patterns. Suggest adjustments.
2. vacancy_predictions: For properties with expiring leases, vacant units, or payment issues, flag risk of upcoming vacancy.
3. high_maintenance_flags: For properties with high open work orders or high maintenance costs relative to rent collected, flag them as problematic.

Each item must have: property (string), insight (string, 2-3 sentences), recommendation (string, actionable), and for high_maintenance_flags also include risk_level ("low"/"medium"/"high").

Be specific, data-driven, and direct. Reference actual numbers from the data.`,
      response_json_schema: {
        type: "object",
        properties: {
          rental_rate_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                property: { type: "string" },
                insight: { type: "string" },
                recommendation: { type: "string" },
              }
            }
          },
          vacancy_predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                property: { type: "string" },
                insight: { type: "string" },
                recommendation: { type: "string" },
              }
            }
          },
          high_maintenance_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                property: { type: "string" },
                insight: { type: "string" },
                recommendation: { type: "string" },
                risk_level: { type: "string" },
              }
            }
          },
          summary: { type: "string" },
        }
      }
    });

    setInsights(result);
    setLastRun(new Date());
    setLoading(false);
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7C6FCD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: "#1A1A2E", margin: "0 0 4px" }}>Portfolio Intelligence</h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>AI analysis of your rental rates, vacancy risk, and maintenance costs</p>
          </div>
        </div>
        <Button
          onClick={analyze}
          disabled={loading}
          style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none", display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", opacity: loading ? 0.7 : 1, flexShrink: 0 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? "Analyzing…" : insights ? "Re-analyze" : "Run Analysis"}
        </Button>
      </div>

      {/* Notice about model */}
      {!insights && !loading && (
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, rgba(124,111,205,0.07) 0%, rgba(124,111,205,0.03) 100%)", border: "1px solid rgba(124,111,205,0.2)", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Sparkles size={18} color="#7C6FCD" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", margin: "0 0 6px" }}>What this analysis covers</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#6B7280", fontSize: 13, lineHeight: 2 }}>
                <li><strong style={{ color: "#1A1A2E" }}>Optimal Rent Rates</strong> — Are your units priced right? Get data-driven suggestions.</li>
                <li><strong style={{ color: "#1A1A2E" }}>Vacancy Predictions</strong> — Flag units at risk with expiring leases or payment issues.</li>
                <li><strong style={{ color: "#1A1A2E" }}>High-Maintenance Properties</strong> — Identify cost-heavy properties draining your ROI.</li>
              </ul>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "10px 0 0" }}>⚡ Uses advanced AI (Claude Sonnet) — uses more integration credits per run.</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(124,111,205,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={24} color="#7C6FCD" className="animate-spin" />
          </div>
          <p style={{ fontWeight: 600, color: "#1A1A2E", margin: 0 }}>Analyzing your portfolio…</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Crunching 6 months of rent, maintenance, and occupancy data</p>
        </div>
      )}

      {insights?.error && (
        <div style={{ ...cardStyle, borderLeft: "4px solid #EF4444", background: "#FFF5F5" }}>
          <p style={{ color: "#EF4444", fontWeight: 600, fontSize: 14, margin: 0 }}>{insights.error}</p>
        </div>
      )}

      {insights && !insights.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary */}
          {insights.summary && (
            <div style={{ ...cardStyle, background: "linear-gradient(135deg, rgba(124,111,205,0.08) 0%, rgba(124,111,205,0.04) 100%)", border: "1px solid rgba(124,111,205,0.2)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Sparkles size={16} color="#7C6FCD" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: "#1A1A2E", margin: 0, lineHeight: 1.65 }}>{insights.summary}</p>
              </div>
              {lastRun && <p style={{ fontSize: 11, color: "#9CA3AF", margin: "10px 0 0" }}>Last analyzed {lastRun.toLocaleTimeString()}</p>}
            </div>
          )}

          <InsightCard
            icon={DollarSign}
            color="#7C6FCD"
            label="Rental Rate Recommendations"
            items={insights.rental_rate_recommendations}
            emptyMsg="No rent rate adjustments needed based on current data."
          />

          <InsightCard
            icon={Home}
            color="#F59E0B"
            label="Vacancy Risk Predictions"
            items={insights.vacancy_predictions}
            emptyMsg="No significant vacancy risks detected."
          />

          <InsightCard
            icon={AlertTriangle}
            color="#EF4444"
            label="High-Maintenance Properties"
            items={insights.high_maintenance_flags}
            emptyMsg="No high-maintenance properties flagged."
          />
        </div>
      )}
    </div>
  );
}
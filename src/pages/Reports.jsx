import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAccount } from "../hooks/useAccount";
import { FileBarChart2, DollarSign, Home, Wrench, AlertCircle, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportModal from "../components/reports/ReportModal";
import MonthlyReportScheduler from "../components/reports/MonthlyReportScheduler";
import SavedReportsTab from "../components/reports/SavedReportsTab";

const REPORT_TYPES = [
  { id: "rent_roll", title: "Rent Roll", icon: FileBarChart2, color: "bg-blue-100 text-blue-600", description: "All units with tenant names, rent amounts, payment status, and lease dates." },
  { id: "income_statement", title: "Income Statement", icon: DollarSign, color: "bg-emerald-100 text-emerald-600", description: "Income vs expenses by month. Filter by date range." },
  { id: "vacancy", title: "Vacancy Report", icon: Home, color: "bg-orange-100 text-orange-600", description: "Vacant units, days vacant, and estimated lost revenue." },
  { id: "maintenance", title: "Maintenance Report", icon: Wrench, color: "bg-violet-100 text-violet-600", description: "All work orders by status, category, cost, and resolution time." },
  { id: "late_payments", title: "Late Payment Report", icon: AlertCircle, color: "bg-red-100 text-red-600", description: "Late payments, amounts, tenant names, and frequency." },
  { id: "year_end", title: "Year-End Financial Summary", icon: Calculator, color: "bg-cyan-100 text-cyan-600", description: "Full-year income, expenses, and net income per property." },
];

const REPORT_TYPE_TO_FOLDER = {
  rent_roll: "Tenant Reports",
  income_statement: "Financial Reports",
  vacancy: "Occupancy Reports",
  maintenance: "Maintenance Reports",
  late_payments: "Financial Reports",
  year_end: "Financial Reports",
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

export default function Reports() {
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(null);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");

  const autoSaveReport = async (type, result) => {
    if (!accountId) return;
    const folder = REPORT_TYPE_TO_FOLDER[type] || "Custom Reports";
    const me = await base44.auth.me().catch(() => null);
    await base44.entities.SavedReport.create({
      name: result.title,
      report_type: result.title,
      folder,
      generated_by: me?.full_name || me?.email || "Unknown",
      generated_at: new Date().toISOString(),
      account_id: accountId,
      report_data: JSON.stringify({ columns: result.columns, rows: result.rows }),
    }).catch(() => {});
  };

  const generate = async (type) => {
    setLoading(type);
    const result = await buildReport(type);
    setReport(result);
    setLoading(null);
    autoSaveReport(type, result);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Generate, download, and analyze reports for your portfolio</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {[{ id: "reports", label: "On-Demand Reports" }, { id: "saved", label: "Saved Reports" }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >{t.label}</button>
        ))}
      </div>

      {activeTab === "saved" && (
        <SavedReportsTab onViewReport={(r) => {
          try { setReport(JSON.parse(r.report_data)); } catch {}
        }} />
      )}

      {activeTab === "reports" && <MonthlyReportScheduler />}

      {activeTab === "reports" && <div>
        <h2 className="text-base font-bold mb-3" style={{ color: '#1A1A2E' }}>On-Demand Reports</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map(rt => (
            <div key={rt.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rt.color}`}>
                  <rt.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{rt.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                disabled={loading === rt.id}
                onClick={() => generate(rt.id)}
              >
                {loading === rt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <rt.icon className="w-4 h-4" />}
                {loading === rt.id ? "Generating…" : "Generate Report"}
              </Button>
            </div>
          ))}
        </div>
      </div>}

      <ReportModal report={report} onClose={() => setReport(null)} />
    </div>
  );
}

async function buildReport(type) {
  const [properties, units, tenants, leases, payments, orders] = await Promise.all([
    base44.entities.Property.list(),
    base44.entities.Unit.list(),
    base44.entities.Tenant.list(),
    base44.entities.Lease.list(),
    base44.entities.Payment.list("-date"),
    base44.entities.WorkOrder.list("-created_date"),
  ]);

  const propById = Object.fromEntries(properties.map(p => [p.id, p]));
  const unitById = Object.fromEntries(units.map(u => [u.id, u]));
  const tenantById = Object.fromEntries(tenants.map(t => [t.id, t]));

  const tenantName = (id) => {
    const t = tenantById[id];
    return t ? `${t.first_name} ${t.last_name}` : "—";
  };

  if (type === "rent_roll") {
    const activeLeases = leases.filter(l => l.status === "active");
    const rows = units.map(u => {
      const lease = activeLeases.find(l => l.unit_id === u.id);
      const tenant = lease ? tenantById[lease.tenant_id] : null;
      const prop = propById[u.property_id];
      const lastPayment = payments.find(p => p.tenant_id === lease?.tenant_id);
      return {
        Property: prop?.nickname || prop?.address || "—",
        Unit: u.unit_number,
        Tenant: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Vacant",
        "Rent Amount": fmt(u.rent_amount),
        "Last Payment": lastPayment ? `${lastPayment.status} (${lastPayment.date})` : "None",
        "Lease Start": lease?.start_date || "—",
        "Lease End": lease?.end_date || "—",
        Status: lease ? "Occupied" : "Vacant",
      };
    });
    return { title: "Rent Roll", columns: ["Property", "Unit", "Tenant", "Rent Amount", "Last Payment", "Lease Start", "Lease End", "Status"], rows };
  }

  if (type === "income_statement") {
    const confirmedPayments = payments.filter(p => p.status === "confirmed");
    const monthMap = {};
    confirmedPayments.forEach(p => {
      const month = p.date?.substring(0, 7);
      if (!month) return;
      if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
      monthMap[month].income += p.amount || 0;
    });
    orders.filter(o => o.cost).forEach(o => {
      const month = o.created_date?.substring(0, 7);
      if (!month) return;
      if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
      monthMap[month].expenses += o.cost || 0;
    });
    const rows = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({
      Month: month,
      Income: fmt(v.income),
      Expenses: fmt(v.expenses),
      "Net Income": fmt(v.income - v.expenses),
    }));
    return { title: "Income Statement", columns: ["Month", "Income", "Expenses", "Net Income"], rows };
  }

  if (type === "vacancy") {
    const occupiedUnitIds = new Set(leases.filter(l => l.status === "active").map(l => l.unit_id));
    const rows = units.filter(u => !occupiedUnitIds.has(u.id)).map(u => {
      const prop = propById[u.property_id];
      const lastLease = leases.filter(l => l.unit_id === u.id && l.end_date).sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
      const vacantSince = lastLease?.end_date ? new Date(lastLease.end_date) : null;
      const daysVacant = vacantSince ? Math.floor((Date.now() - vacantSince) / 86400000) : "Unknown";
      const lostRevenue = (u.rent_amount || 0) * (typeof daysVacant === "number" ? daysVacant / 30 : 0);
      return {
        Property: prop?.nickname || prop?.address || "—",
        Unit: u.unit_number,
        Bedrooms: u.bedrooms ?? "—",
        "Rent Amount": fmt(u.rent_amount),
        "Vacant Since": vacantSince ? vacantSince.toLocaleDateString() : "Unknown",
        "Days Vacant": typeof daysVacant === "number" ? daysVacant : "Unknown",
        "Est. Lost Revenue": lostRevenue > 0 ? fmt(lostRevenue) : "—",
      };
    });
    return { title: "Vacancy Report", columns: ["Property", "Unit", "Bedrooms", "Rent Amount", "Vacant Since", "Days Vacant", "Est. Lost Revenue"], rows, note: `${rows.length} vacant units` };
  }

  if (type === "maintenance") {
    const rows = orders.map(o => {
      const unit = unitById[o.unit_id];
      const prop = propById[o.property_id] || (unit ? propById[unit.property_id] : null);
      const closedDate = o.status === "closed" ? new Date(o.updated_date) : null;
      const openedDate = new Date(o.created_date);
      const days = closedDate ? Math.floor((closedDate - openedDate) / 86400000) : null;
      return {
        Date: openedDate.toLocaleDateString(),
        Property: prop?.nickname || prop?.address || "—",
        Tenant: tenantName(o.tenant_id),
        Category: o.category,
        Issue: o.summary?.substring(0, 50),
        Urgency: o.urgency,
        Status: o.status?.replace("_", " "),
        Cost: o.cost ? fmt(o.cost) : "—",
        "Days to Close": days != null ? days : "Open",
      };
    });
    const closed = rows.filter(r => r["Days to Close"] !== "Open");
    const avgDays = closed.length ? Math.round(closed.reduce((s, r) => s + Number(r["Days to Close"]), 0) / closed.length) : "N/A";
    return { title: "Maintenance Report", columns: ["Date", "Property", "Tenant", "Category", "Issue", "Urgency", "Status", "Cost", "Days to Close"], rows, note: `${rows.length} total orders · Average resolution: ${avgDays} days` };
  }

  if (type === "late_payments") {
    const byTenant = {};
    payments.forEach(p => {
      if (!byTenant[p.tenant_id]) byTenant[p.tenant_id] = [];
      byTenant[p.tenant_id].push(p);
    });
    const lateRows = [];
    Object.entries(byTenant).forEach(([tid, pmts]) => {
      const sorted = [...pmts].sort((a, b) => new Date(a.date) - new Date(b.date));
      sorted.forEach((p, i) => {
        if (i === 0) return;
        const prev = sorted[i - 1];
        const daysDiff = (new Date(p.date) - new Date(prev.date)) / 86400000;
        if (daysDiff > 35) {
          lateRows.push({
            Tenant: tenantName(tid),
            "Payment Date": p.date,
            Amount: fmt(p.amount),
            Method: p.method?.replace("_", " "),
            Status: p.status,
            "Days Since Last": Math.round(daysDiff),
          });
        }
      });
      if (pmts.filter(p => p.status === "failed").length > 0) {
        pmts.filter(p => p.status === "failed").forEach(p => {
          lateRows.push({
            Tenant: tenantName(tid),
            "Payment Date": p.date,
            Amount: fmt(p.amount),
            Method: p.method?.replace("_", " "),
            Status: "failed",
            "Days Since Last": "—",
          });
        });
      }
    });
    return { title: "Late Payment Report", columns: ["Tenant", "Payment Date", "Amount", "Method", "Status", "Days Since Last"], rows: lateRows, note: `${lateRows.length} late or failed payment events` };
  }

  if (type === "year_end") {
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const yearPayments = payments.filter(p => p.status === "confirmed" && p.date >= yearStart && p.date <= yearEnd);
    const yearOrders = orders.filter(o => o.cost && o.created_date >= yearStart && o.created_date <= yearEnd);

    const propRows = properties.map(prop => {
      const propUnits = units.filter(u => u.property_id === prop.id);
      const propUnitIds = new Set(propUnits.map(u => u.id));
      const propTenantIds = new Set(leases.filter(l => propUnitIds.has(l.unit_id)).map(l => l.tenant_id));
      const income = yearPayments.filter(p => propTenantIds.has(p.tenant_id)).reduce((s, p) => s + (p.amount || 0), 0);
      const expenses = yearOrders.filter(o => o.property_id === prop.id || propUnitIds.has(o.unit_id)).reduce((s, o) => s + (o.cost || 0), 0);
      return {
        Property: prop.nickname || prop.address,
        Units: propUnits.length,
        "Total Income": fmt(income),
        "Total Expenses": fmt(expenses),
        "Net Income": fmt(income - expenses),
        "Avg Monthly Income": fmt(Math.round(income / 12)),
      };
    });
    const totals = {
      Property: "TOTAL",
      Units: propRows.reduce((s, r) => s + r.Units, 0),
      "Total Income": fmt(propRows.reduce((s, r) => s + Number(r["Total Income"].replace(/[$,]/g, "") || 0), 0)),
      "Total Expenses": fmt(propRows.reduce((s, r) => s + Number(r["Total Expenses"].replace(/[$,]/g, "") || 0), 0)),
      "Net Income": fmt(propRows.reduce((s, r) => s + Number(r["Net Income"].replace(/[$,]/g, "") || 0), 0)),
      "Avg Monthly Income": "—",
    };
    return { title: `Year-End Financial Summary (${year})`, columns: ["Property", "Units", "Total Income", "Total Expenses", "Net Income", "Avg Monthly Income"], rows: [...propRows, totals] };
  }

  return { title: "Report", columns: [], rows: [] };
}
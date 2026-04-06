import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, TrendingDown, Upload } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PerPropertyTab from "../components/financials/PerPropertyTab";
import TaxEstimatorTab from "../components/financials/TaxEstimatorTab";
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import ViewOnlyBanner from "../components/ViewOnlyBanner";

const TABS = [
  { id: "trends",      label: "Trends" },
  { id: "forecast",    label: "AI Forecast" },
  { id: "categories",  label: "Categories" },
  { id: "reports",     label: "Reports" },
  { id: "invoices",    label: "Invoices" },
  { id: "budgets",     label: "Budgets" },
  { id: "recurring",   label: "Recurring" },
  { id: "payments",    label: "Payments" },
  { id: "banking",     label: "Banking" },
  { id: "taxes",       label: "Taxes" },
  { id: "all",         label: "All Records" },
];

const REPORT_CARDS = [
  { title: "Rent Roll",          desc: "All units, tenants, rent amounts & status" },
  { title: "Income Statement",   desc: "Revenue vs expenses summary" },
  { title: "Vacancy Report",     desc: "Vacant units & revenue loss estimate" },
  { title: "Maintenance Cost",   desc: "Work order costs by category" },
  { title: "Payment History",    desc: "All confirmed payments by tenant" },
  { title: "Year-End Summary",   desc: "Annual income & expense overview" },
];

export default function Financials() {
  const { accountId } = useAccount();
  const { canWrite } = usePermissions('financials');
  const [tab, setTab] = useState("trends");
  const [payments, setPayments] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      base44.entities.Payment.filter({ status: "confirmed", account_id: accountId }),
      base44.entities.WorkOrder.filter({ account_id: accountId }),
      base44.entities.Property.filter({ account_id: accountId }),
    ]).then(([p, wo, props]) => { setPayments(p); setWorkOrders(wo); setProperties(props); setLoading(false); });
  }, [accountId]);

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = workOrders.reduce((s, wo) => s + (wo.cost || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Build 6-month revenue vs expenses chart
  const sixMonthData = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.toISOString().slice(0, 7);
    sixMonthData[m] = { month: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, expenses: 0 };
  }
  payments.forEach(p => {
    const m = p.date?.slice(0, 7);
    if (sixMonthData[m]) sixMonthData[m].revenue += (p.amount || 0);
  });
  workOrders.forEach(wo => {
    const m = wo.created_date?.slice(0, 7);
    if (sixMonthData[m]) sixMonthData[m].expenses += (wo.cost || 0);
  });
  const chartData = Object.values(sixMonthData);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with title, subtitle, and action buttons */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Financial Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button style={{ backgroundColor: '#059669', color: 'white', border: 'none' }} className="gap-2">
            + Add Transaction
          </Button>
        </div>
      </div>

      {!canWrite && <ViewOnlyBanner />}

      {/* KPI Cards */}
      <div className="space-y-3">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#059669' }}>${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <TrendingUp className="w-8 h-8" style={{ color: '#059669' }} />
          </div>
        </div>
        {/* Total Expenses */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#DC2626' }}>${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <TrendingDown className="w-8 h-8" style={{ color: '#DC2626' }} />
          </div>
        </div>
        {/* Net Profit */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #D1FAE5' }}>
          <p className="text-sm text-muted-foreground mb-2">Net Profit</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#059669' }}>${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <DollarSign className="w-8 h-8" style={{ color: '#059669' }} />
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Revenue vs Expenses (Last 6 Months)</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#059669" dot={{ fill: '#059669', r: 5 }} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" dot={{ fill: '#DC2626', r: 5 }} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "trends" && (
        <div className="text-center py-12 text-muted-foreground">
          Trends tab content coming soon
        </div>
      )}

      {tab === "forecast" && (
        <div className="text-center py-12 text-muted-foreground">
          AI Forecast tab content coming soon
        </div>
      )}

      {tab === "categories" && (
        <div className="text-center py-12 text-muted-foreground">
          Categories tab content coming soon
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Generate and export detailed reports for your portfolio.</p>
            <Link to="/reports" className="text-sm text-primary font-medium hover:underline">Open full Reports page →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_CARDS.map(r => (
              <Link key={r.title} to="/reports" className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="text-center py-12 text-muted-foreground">
          Invoices tab content coming soon
        </div>
      )}

      {tab === "budgets" && (
        <div className="text-center py-12 text-muted-foreground">
          Budgets tab content coming soon
        </div>
      )}

      {tab === "recurring" && (
        <div className="text-center py-12 text-muted-foreground">
          Recurring tab content coming soon
        </div>
      )}

      {tab === "payments" && (
        <div className="text-center py-12 text-muted-foreground">
          Payments tab content coming soon
        </div>
      )}

      {tab === "banking" && (
        <div className="text-center py-12 text-muted-foreground">
          Banking tab content coming soon
        </div>
      )}

      {tab === "taxes" && <TaxEstimatorTab />}

      {tab === "all" && (
        <div className="text-center py-12 text-muted-foreground">
          All Records tab content coming soon
        </div>
      )}
    </div>
  );
}
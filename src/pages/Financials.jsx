import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, ArrowUpRight, Building2, Calculator, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import PerPropertyTab from "../components/financials/PerPropertyTab";
import TaxEstimatorTab from "../components/financials/TaxEstimatorTab";

const TABS = [
  { id: "overview",   label: "Overview",       icon: TrendingUp },
  { id: "property",   label: "Per Property",   icon: Building2 },
  { id: "tax",        label: "Tax Estimator",  icon: Calculator },
  { id: "reports",    label: "Reports",        icon: ClipboardList },
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
  const [tab, setTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Payment.filter({ status: "confirmed" }),
      base44.entities.Property.list(),
    ]).then(([p, props]) => { setPayments(p); setProperties(props); setLoading(false); });
  }, []);

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = payments.filter(p => p.date?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0);

  const byMonth = payments.reduce((acc, p) => {
    const m = p.date?.slice(0, 7); if (!m) return acc;
    acc[m] = (acc[m] || 0) + (p.amount || 0); return acc;
  }, {});
  const chartData = Object.entries(byMonth).sort().slice(-12).map(([m, v]) => ({ month: m.slice(5), revenue: v }));
  const byMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + (p.amount || 0); return acc; }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold">Financials</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue overview & analysis</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><DollarSign className="w-4 h-4" /><span className="text-sm">Total Revenue</span></div>
              <div className="text-3xl font-outfit font-bold">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><TrendingUp className="w-4 h-4" /><span className="text-sm">This Month</span></div>
              <div className="text-3xl font-outfit font-bold">${monthRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><ArrowUpRight className="w-4 h-4" /><span className="text-sm">Payments</span></div>
              <div className="text-3xl font-outfit font-bold">{payments.length}</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Revenue by Month</h2>
            {chartData.length === 0 ? <p className="text-center text-muted-foreground py-12">No data yet</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(235 85% 58%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Revenue by Payment Method</h2>
            <div className="space-y-3">
              {Object.entries(byMethod).map(([method, total]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(total / totalRevenue) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">${total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per Property */}
      {tab === "property" && <PerPropertyTab properties={properties} />}

      {/* Tax Estimator */}
      {tab === "tax" && <TaxEstimatorTab />}

      {/* Reports */}
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
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
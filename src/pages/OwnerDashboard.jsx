import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users2, DollarSign, TrendingUp, UserPlus, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const PLANS = [
  { id: "starter",    name: "Starter",    price: 29,  color: "#6366f1" },
  { id: "growth",     name: "Growth",     price: 79,  color: "#8b5cf6" },
  { id: "pro",        name: "Pro",        price: 149, color: "#a855f7" },
  { id: "enterprise", name: "Enterprise", price: 299, color: "#ec4899" },
];
const planPrice = (tier) => PLANS.find(p => p.id === tier)?.price || 0;
const planColor = (tier) => PLANS.find(p => p.id === tier)?.color || "#94a3b8";
const fmt = (n) => `$${Number(n).toLocaleString()}`;

const statusColor = { active: "default", trialing: "outline", past_due: "destructive", canceled: "secondary" };

// Generate last 12 month labels
function last12Months() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default function OwnerDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Account.list(),
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
      base44.entities.Tenant.list(),
    ]).then(([acc, props, units, tenants]) => {
      setAccounts(acc);
      setStats({ properties: props.length, units: units.length, tenants: tenants.length });
      setLoading(false);
    });
  }, []);

  const activeAccounts = accounts.filter(a => a.subscription_status === "active" || a.subscription_status === "trialing");
  const mrr = activeAccounts.reduce((s, a) => s + planPrice(a.plan_tier), 0);
  const arr = mrr * 12;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();

  const newThisMonth = accounts.filter(a => a.created_date?.startsWith(thisMonth)).length;
  const churnedThisMonth = accounts.filter(a =>
    a.subscription_status === "canceled" && a.updated_date?.startsWith(thisMonth)
  ).length;

  // MRR trend — sum plan prices of accounts created on or before each month that are still active
  const months = last12Months();
  const mrrTrend = months.map(m => {
    const active = accounts.filter(a =>
      (a.subscription_status === "active" || a.subscription_status === "trialing") &&
      a.created_date?.slice(0, 7) <= m
    );
    return { month: m.slice(5), mrr: active.reduce((s, a) => s + planPrice(a.plan_tier), 0) };
  });

  // New clients per month
  const newByMonth = months.map(m => ({
    month: m.slice(5),
    clients: accounts.filter(a => a.created_date?.startsWith(m)).length,
  }));

  // Plan distribution for pie
  const pieData = PLANS.map(p => ({
    name: p.name,
    value: activeAccounts.filter(a => a.plan_tier === p.id).length,
    color: p.color,
  })).filter(p => p.value > 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>All clients and revenue at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Clients",       value: accounts.length,        icon: Users2,    bg: "bg-blue-50",    color: "text-blue-600" },
          { label: "MRR",                 value: fmt(mrr),               icon: DollarSign, bg: "bg-violet-50",  color: "text-violet-600" },
          { label: "ARR",                 value: fmt(arr),               icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "New This Month",      value: newThisMonth,           icon: UserPlus,  bg: "bg-green-50",   color: "text-green-600" },
          { label: "Churned This Month",  value: churnedThisMonth,       icon: UserMinus, bg: "bg-red-50",     color: "text-red-600" },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>{c.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* MRR Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>MRR Trend — Last 12 Months</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={mrrTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => [fmt(v), "MRR"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* New Clients Bar */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>New Clients per Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={newByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="clients" name="New Clients" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution Pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Plan Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#6B7280' }}>No active subscriptions</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-sm" style={{ color: '#1A1A2E' }}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                    <span className="font-semibold ml-1">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Analytics */}
      <div className="space-y-4">
        <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Platform Analytics</h2>
        {(() => {
          // Calculate platform-wide metrics
          const allPayments = accounts.flatMap(a => []);
          return (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A1A2E' }}>Platform Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mrrTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [fmt(v), "MRR"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A1A2E' }}>Total Work Orders ({accounts.length} clients)</h3>
                <div className="text-3xl font-bold" style={{ color: '#7C6FCD' }}>{stats.units}</div>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Across all client accounts</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Clients Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>All Clients</h2>
          <a href="/owner/clients" className="text-xs hover:underline font-medium" style={{ color: '#7C6FCD' }}>Manage all →</a>
        </div>
        {accounts.length === 0 ? (
          <div className="p-16 text-center"><Users2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7280' }} /><p style={{ color: '#6B7280' }}>No clients yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Company","Plan","Status","MRR","Owner","Joined"].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {accounts.slice(0, 8).map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>{a.company_name}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: '#4B5563' }}>{a.plan_tier || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[a.subscription_status] || "secondary"}>{a.subscription_status || "—"}</Badge></td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#22C55E' }}>{a.mrr ? fmt(a.mrr) : "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#4B5563' }}>{a.owner_email}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#4B5563' }}>{a.created_date ? new Date(a.created_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
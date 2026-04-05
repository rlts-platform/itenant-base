import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Users2, Star, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PLANS = [
  { id: "starter",    name: "Starter",    price: 29,  maxUnits: 10,        maxTenants: 10,        color: "#6366f1" },
  { id: "growth",     name: "Growth",     price: 79,  maxUnits: 50,        maxTenants: 50,        color: "#8b5cf6" },
  { id: "pro",        name: "Pro",        price: 149, maxUnits: 200,       maxTenants: 200,       color: "#a855f7" },
  { id: "enterprise", name: "Enterprise", price: 299, maxUnits: "Unlimited", maxTenants: "Unlimited", color: "#ec4899" },
];

const fmt = (n) => `$${Number(n).toLocaleString()}`;

export default function OwnerRevenue() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Account.list().then(a => { setAccounts(a); setLoading(false); });
  }, []);

  const activeAccounts = accounts.filter(a => a.subscription_status === "active" || a.subscription_status === "trialing");

  const planCounts = Object.fromEntries(PLANS.map(p => [p.id, 0]));
  activeAccounts.forEach(a => { if (planCounts[a.plan_tier] !== undefined) planCounts[a.plan_tier]++; });

  const mrr = PLANS.reduce((sum, p) => sum + p.price * (planCounts[p.id] || 0), 0);
  const arr = mrr * 12;
  const avgRevPerClient = activeAccounts.length ? Math.round(mrr / activeAccounts.length) : 0;
  const topPlan = PLANS.reduce((top, p) => (planCounts[p.id] > (planCounts[top?.id] || 0) ? p : top), PLANS[0]);

  const chartData = PLANS.map(p => ({
    name: p.name,
    revenue: p.price * (planCounts[p.id] || 0),
    clients: planCounts[p.id] || 0,
    color: p.color,
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold">Revenue</h1>
        <p className="text-sm text-muted-foreground mt-1">Subscription plans, MRR, and revenue breakdown</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total MRR", value: fmt(mrr), icon: DollarSign, bg: "bg-violet-50", color: "text-violet-600", sub: "Monthly recurring revenue" },
          { label: "Total ARR", value: fmt(arr), icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600", sub: "Annual run rate" },
          { label: "Avg Rev / Client", value: fmt(avgRevPerClient), icon: Users2, bg: "bg-blue-50", color: "text-blue-600", sub: `Across ${activeAccounts.length} active clients` },
          { label: "Top Plan", value: topPlan.name, icon: Star, bg: "bg-pink-50", color: "text-pink-600", sub: `${planCounts[topPlan.id]} clients` },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-outfit font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            <div className="text-xs text-muted-foreground/70 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Projected Next Month */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-80">Projected Next Month Revenue</div>
          <div className="text-4xl font-outfit font-bold mt-1">{fmt(mrr)}</div>
          <div className="text-sm opacity-70 mt-0.5">Based on {activeAccounts.length} active subscriptions</div>
        </div>
        <div className="flex items-center gap-1 text-emerald-300 font-semibold">
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-lg">{fmt(mrr)}/mo</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plans Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Subscription Plans</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>
                {["Plan", "Monthly Price", "Max Units", "Max Tenants", "Active Clients", "Plan MRR"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{fmt(p.price)}/mo</td>
                  <td className="px-4 py-3">{p.maxUnits}</td>
                  <td className="px-4 py-3">{p.maxTenants}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {planCounts[p.id]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{fmt(p.price * (planCounts[p.id] || 0))}</td>
                </tr>
              ))}
              <tr className="bg-secondary/50 font-semibold">
                <td className="px-4 py-3" colSpan={4}>Total</td>
                <td className="px-4 py-3">{activeAccounts.length}</td>
                <td className="px-4 py-3 text-emerald-700">{fmt(mrr)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Revenue by Plan Tier</h2>
          {mrr === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No active subscriptions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(v, name) => [`$${v}`, "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 flex-wrap">
            {PLANS.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} ({planCounts[p.id]} clients)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
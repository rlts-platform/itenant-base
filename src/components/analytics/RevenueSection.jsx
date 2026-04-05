import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueSection({ dateRange }) {
  const [data, setData] = useState({ trendData: [], breakdownData: [], thisMonth: 0, lastMonth: 0, nextMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [payments, leases, properties] = await Promise.all([
        base44.entities.Payment.list(),
        base44.entities.Lease.list(),
        base44.entities.Property.list(),
      ]);

      const confirmedPayments = payments.filter(p => p.status === "confirmed" && p.date >= dateRange.startDate && p.date <= dateRange.endDate);
      
      // 6-month trend
      const trendMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        trendMap[monthStr] = 0;
      }
      confirmedPayments.forEach(p => {
        const m = p.date?.slice(0, 7);
        if (m && trendMap.hasOwnProperty(m)) trendMap[m] += p.amount || 0;
      });
      const trendData = Object.entries(trendMap).map(([m, amt]) => ({
        month: m.slice(5),
        amount: amt,
      }));

      // Revenue by property
      const propMap = {};
      confirmedPayments.forEach(p => {
        const lease = leases.find(l => l.id === p.tenant_id || leases.find(ll => ll.tenant_id === p.tenant_id));
        if (lease) {
          const prop = properties.find(pr => pr.id === lease.unit_id || "");
          if (prop) {
            if (!propMap[prop.id]) propMap[prop.id] = { name: prop.nickname || prop.address, amount: 0 };
            propMap[prop.id].amount += p.amount || 0;
          }
        }
      });
      const breakdownData = Object.values(propMap).sort((a, b) => b.amount - a.amount);

      // This month vs last month
      const now = new Date();
      const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastMonthStr = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
      const thisMonth = confirmedPayments.filter(p => p.date?.startsWith(thisMonthStr)).reduce((s, p) => s + (p.amount || 0), 0);
      const lastMonth = confirmedPayments.filter(p => p.date?.startsWith(lastMonthStr)).reduce((s, p) => s + (p.amount || 0), 0);

      // Projected next month: sum of active lease rent
      const activeLeases = leases.filter(l => l.status === "active");
      const nextMonth = activeLeases.reduce((s, l) => s + (l.rent_amount || 0), 0);

      setData({ trendData, breakdownData, thisMonth, lastMonth, nextMonth });
      setLoading(false);
    }
    load();
  }, [dateRange]);

  if (loading) return <div className="text-center text-muted-foreground">Loading...</div>;

  const pctChange = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Revenue</h2>
      
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">This Month</span>
          </div>
          <p className="text-2xl font-bold">${thisMonth.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${pctChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange)}% vs last month
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Projected Next Month</span>
          </div>
          <p className="text-2xl font-bold">${nextMonth.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">6-Month Total</span>
          <p className="text-2xl font-bold mt-2">${data.trendData.reduce((s, d) => s + d.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4">6-Month Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,111,205,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="amount" stroke="#7C6FCD" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4">Revenue by Property</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.breakdownData.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,111,205,0.1)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="amount" fill="#7C6FCD" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
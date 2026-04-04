import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Financials() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Payment.filter({ status: "confirmed" }).then(p => { setPayments(p); setLoading(false); });
  }, []);

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = payments.filter(p => p.date?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0);

  const byMonth = payments.reduce((acc, p) => {
    const m = p.date?.slice(0, 7);
    if (!m) return acc;
    acc[m] = (acc[m] || 0) + (p.amount || 0);
    return acc;
  }, {});
  const chartData = Object.entries(byMonth).sort().slice(-12).map(([m, v]) => ({ month: m.slice(5), revenue: v }));

  const byMethod = payments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + (p.amount || 0); return acc; }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-700">Financials</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><DollarSign className="w-4 h-4" /><span className="text-sm">Total Revenue</span></div>
          <div className="text-3xl font-outfit font-700">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><TrendingUp className="w-4 h-4" /><span className="text-sm">This Month</span></div>
          <div className="text-3xl font-outfit font-700">${monthRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><ArrowUpRight className="w-4 h-4" /><span className="text-sm">Payments</span></div>
          <div className="text-3xl font-outfit font-700">{payments.length}</div>
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
  );
}
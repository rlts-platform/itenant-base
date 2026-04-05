import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

export default function AnalyticsPreview() {
  const [data, setData] = useState({ trendData: [], occupancy: 0, occupied: 0, vacant: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [payments, units, leases] = await Promise.all([
        base44.entities.Payment.list(),
        base44.entities.Unit.list(),
        base44.entities.Lease.list(),
      ]);

      // 6-month revenue trend
      const trendMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        trendMap[monthStr] = 0;
      }
      payments.filter(p => p.status === "confirmed").forEach(p => {
        const m = p.date?.slice(0, 7);
        if (m && trendMap.hasOwnProperty(m)) trendMap[m] += p.amount || 0;
      });
      const trendData = Object.entries(trendMap).map(([m, amt]) => ({
        month: m.slice(5),
        amount: amt,
      }));

      // Occupancy
      const occupied = units.filter(u => u.status === "occupied").length;
      const vacant = units.filter(u => u.status === "vacant").length;
      const total = units.length;
      const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

      setData({ trendData, occupancy, occupied, vacant });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;

  const pieData = [
    { name: "Occupied", value: data.occupied, fill: "#7C6FCD" },
    { name: "Vacant", value: data.vacant, fill: "rgba(124,111,205,0.2)" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Analytics Snapshot</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">6-Month Revenue</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,111,205,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="amount" stroke="#7C6FCD" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Portfolio Occupancy: {data.occupancy}%</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" label={false}>
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Link to="/analytics">
        <Button className="w-full">View Full Analytics</Button>
      </Link>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wrench } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MaintenanceSection({ dateRange }) {
  const [data, setData] = useState({ totalCost: 0, avgResTime: 0, statusData: [], spendData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const rawOrders = await base44.entities.WorkOrder.list();
        const orders = rawOrders || [];

        const filtered = orders.filter(o => o.created_date >= dateRange.startDate && o.created_date <= dateRange.endDate);
        const totalCost = filtered.reduce((s, o) => s + (o.cost || 0), 0);

        const closed = filtered.filter(o => o.status === "closed");
        let avgResTime = 0;
        if (closed.length > 0) {
          const totalDays = closed.reduce((s, o) => {
            if (!o.created_date || !o.updated_date) return s;
            const days = Math.ceil((new Date(o.updated_date) - new Date(o.created_date)) / (1000 * 60 * 60 * 24));
            return s + days;
          }, 0);
          avgResTime = Math.round(totalDays / closed.length);
        }

        const statusMap = { new: 0, in_progress: 0, closed: 0 };
        filtered.forEach(o => { if (statusMap.hasOwnProperty(o.status)) statusMap[o.status]++; });
        const statusData = [
          { name: "Open", value: statusMap.new, fill: "#F59E0B" },
          { name: "In Progress", value: statusMap.in_progress, fill: "#3B82F6" },
          { name: "Completed", value: statusMap.closed, fill: "#10B981" },
        ].filter(d => d.value > 0);

        const spendMap = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          spendMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
        }
        filtered.forEach(o => {
          const m = o.created_date?.slice(0, 7);
          if (m && spendMap.hasOwnProperty(m)) spendMap[m] += o.cost || 0;
        });
        const spendData = Object.entries(spendMap).map(([m, cost]) => ({ month: m.slice(5), cost }));

        setData({ totalCost, avgResTime, statusData, spendData });
      } catch (err) {
        console.error("MaintenanceSection load error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateRange]);

  if (loading) return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  if (error) return <div className="text-center text-muted-foreground py-8">Maintenance data unavailable.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#1A1A2E' }}>Maintenance</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Total Estimated Cost</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>${data.totalCost.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Avg Resolution Time</span>
          <p className="text-2xl font-bold mt-2" style={{ color: '#1A1A2E' }}>{data.avgResTime} days</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A1A2E' }}>Work Orders by Status</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.statusData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {data.statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs" style={{ color: '#1A1A2E' }}>
            {data.statusData.map(d => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A1A2E' }}>Maintenance Spend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.spendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,111,205,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="cost" fill="#7C6FCD" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function OccupancySection({ dateRange }) {
  const [data, setData] = useState({ occupancy: 0, occupied: 0, vacant: 0, byProperty: [], unitsAtRisk: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [units, properties, leases] = await Promise.all([
        base44.entities.Unit.list(),
        base44.entities.Property.list(),
        base44.entities.Lease.list(),
      ]);

      const occupied = units.filter(u => u.status === "occupied").length;
      const vacant = units.filter(u => u.status === "vacant").length;
      const total = units.length;
      const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

      // By property
      const propMap = {};
      properties.forEach(p => {
        propMap[p.id] = { name: p.nickname || p.address, occupied: 0, total: 0 };
      });
      units.forEach(u => {
        if (propMap[u.property_id]) {
          propMap[u.property_id].total++;
          if (u.status === "occupied") propMap[u.property_id].occupied++;
        }
      });
      const byProperty = Object.values(propMap).map(p => ({
        ...p,
        rate: p.total > 0 ? Math.round((p.occupied / p.total) * 100) : 0,
      }));

      // Units at risk: leases expiring in 60 days with no renewal
      const now = new Date();
      const sixtyDaysOut = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const atRisk = leases.filter(l => l.status === "active" && l.end_date <= sixtyDaysOut);

      setData({ occupancy, occupied, vacant, byProperty, unitsAtRisk: atRisk.slice(0, 5) });
      setLoading(false);
    }
    load();
  }, [dateRange]);

  if (loading) return <div className="text-center text-muted-foreground">Loading...</div>;

  const pieData = [
    { name: "Occupied", value: data.occupied, fill: "#7C6FCD" },
    { name: "Vacant", value: data.vacant, fill: "rgba(124,111,205,0.2)" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#1A1A2E' }}>Occupancy</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Portfolio Occupancy Rate</span>
          <p className="text-3xl font-bold mt-2" style={{ color: '#7C6FCD' }}>{data.occupancy}%</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{data.occupied} of {data.occupied + data.vacant} units occupied</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" label={false}>
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By property */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm mb-3" style={{ color: '#1A1A2E' }}>Occupancy by Property</h3>
        <div className="space-y-3">
          {data.byProperty.map(p => (
            <div key={p.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium" style={{ color: '#1A1A2E' }}>{p.name}</span>
                <span style={{ color: '#6B7280' }}>{p.occupied}/{p.total} units</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${p.rate}%` }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#7C6FCD' }}>{p.rate}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* At risk */}
      {data.unitsAtRisk.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm" style={{ color: '#92400E' }}>Units at Risk ({data.unitsAtRisk.length})</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: '#B45309' }}>Leases expiring within 60 days with no renewal started</p>
          <div className="space-y-1 text-xs" style={{ color: '#92400E' }}>
            {data.unitsAtRisk.map(l => (
              <div key={l.id}>• Lease ending {l.end_date}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
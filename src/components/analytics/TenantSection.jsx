import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function TenantSection({ dateRange }) {
  const [data, setData] = useState({ onTimeRate: 0, topLate: [], retentionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [payments, leases, tenants] = await Promise.all([
        base44.entities.Payment.list(),
        base44.entities.Lease.list(),
        base44.entities.Tenant.list(),
      ]);

      // On-time payment rate
      const filtered = payments.filter(p => p.date >= dateRange.startDate && p.date <= dateRange.endDate && p.status === "confirmed");
      let onTime = 0;
      filtered.forEach(p => {
        const lease = leases.find(l => l.tenant_id === p.tenant_id);
        if (lease && p.date <= lease.end_date) onTime++;
      });
      const onTimeRate = filtered.length > 0 ? Math.round((onTime / filtered.length) * 100) : 0;

      // Top late payers
      const tenantLateMap = {};
      payments.filter(p => p.status === "confirmed").forEach(p => {
        const lease = leases.find(l => l.tenant_id === p.tenant_id);
        if (lease && p.date > lease.end_date) {
          if (!tenantLateMap[p.tenant_id]) {
            const t = tenants.find(tt => tt.id === p.tenant_id);
            tenantLateMap[p.tenant_id] = { name: t ? `${t.first_name} ${t.last_name}` : "Unknown", count: 0 };
          }
          tenantLateMap[p.tenant_id].count++;
        }
      });
      const topLate = Object.values(tenantLateMap).sort((a, b) => b.count - a.count).slice(0, 5);

      // Retention rate (last 12 months)
      const year = new Date().getFullYear();
      const month = new Date().getMonth();
      const oneYearAgo = `${year - 1}-${String(month + 1).padStart(2, "0")}`;
      const expiredLeases = leases.filter(l => l.status === "expired" && l.end_date >= oneYearAgo);
      const renewedLeases = expiredLeases.filter(el => {
        return leases.find(nl => nl.status === "active" && nl.tenant_id === el.tenant_id && nl.start_date > el.end_date);
      });
      const retentionRate = expiredLeases.length > 0 ? Math.round((renewedLeases.length / expiredLeases.length) * 100) : 0;

      setData({ onTimeRate, topLate, retentionRate });
      setLoading(false);
    }
    load();
  }, [dateRange]);

  if (loading) return <div className="text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tenant Performance</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">On-Time Payment Rate</span>
          <p className="text-3xl font-bold mt-2 text-primary">{data.onTimeRate}%</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">Tenant Retention (12mo)</span>
          <p className="text-3xl font-bold mt-2 text-primary">{data.retentionRate}%</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">Repeat Late Payers</span>
          <p className="text-3xl font-bold mt-2">{data.topLate.length}</p>
        </div>
      </div>

      {/* Top late payers */}
      {data.topLate.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm text-amber-900">Top Late Payers</h3>
          </div>
          <div className="space-y-2 text-xs text-amber-900">
            {data.topLate.map((t, i) => (
              <div key={i} className="flex justify-between">
                <span>{t.name}</span>
                <span className="font-semibold text-amber-600">{t.count} late</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
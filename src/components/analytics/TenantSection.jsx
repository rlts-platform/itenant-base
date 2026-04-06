import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function TenantSection({ dateRange }) {
  const [data, setData] = useState({ onTimeRate: 0, topLate: [], retentionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [rawPayments, rawLeases, rawTenants] = await Promise.all([
          base44.entities.Payment.list(),
          base44.entities.Lease.list(),
          base44.entities.Tenant.list(),
        ]);
        const payments = rawPayments || [];
        const leases = rawLeases || [];
        const tenants = rawTenants || [];

        const filtered = payments.filter(p => p.date >= dateRange.startDate && p.date <= dateRange.endDate && p.status === "confirmed");
        let onTime = 0;
        filtered.forEach(p => {
          const lease = leases.find(l => l.tenant_id === p.tenant_id);
          if (lease && p.date <= lease.end_date) onTime++;
        });
        const onTimeRate = filtered.length > 0 ? Math.round((onTime / filtered.length) * 100) : 0;

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

        const now = new Date();
        const oneYearAgo = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const expiredLeases = leases.filter(l => l.status === "expired" && l.end_date >= oneYearAgo);
        const renewedLeases = expiredLeases.filter(el => leases.find(nl => nl.status === "active" && nl.tenant_id === el.tenant_id && nl.start_date > el.end_date));
        const retentionRate = expiredLeases.length > 0 ? Math.round((renewedLeases.length / expiredLeases.length) * 100) : 0;

        setData({ onTimeRate, topLate, retentionRate });
      } catch (err) {
        console.error("TenantSection load error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateRange]);

  if (loading) return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  if (error) return <div className="text-center text-muted-foreground py-8">Tenant data unavailable.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: '#1A1A2E' }}>Tenant Performance</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>On-Time Payment Rate</span>
          <p className="text-3xl font-bold mt-2" style={{ color: '#7C6FCD' }}>{data.onTimeRate}%</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Tenant Retention (12mo)</span>
          <p className="text-3xl font-bold mt-2" style={{ color: '#7C6FCD' }}>{data.retentionRate}%</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Repeat Late Payers</span>
          <p className="text-3xl font-bold mt-2" style={{ color: '#1A1A2E' }}>{data.topLate.length}</p>
        </div>
      </div>

      {/* Top late payers */}
      {data.topLate.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm" style={{ color: '#92400E' }}>Top Late Payers</h3>
          </div>
          <div className="space-y-2 text-xs" style={{ color: '#92400E' }}>
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
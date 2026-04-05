import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PropertyFinancialsTab({ units, leases, payments, orders }) {
  const unitIds = new Set(units.map(u => u.id));
  const tenantIds = new Set(leases.filter(l => unitIds.has(l.unit_id)).map(l => l.tenant_id));

  const propPayments = payments.filter(p => tenantIds.has(p.tenant_id) && p.status === "confirmed");
  const propOrders = orders;

  const totalCollected = propPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = propOrders.reduce((s, o) => s + (o.cost || 0), 0);
  const netIncome = totalCollected - totalExpenses;

  // Monthly revenue
  const monthlyMap = {};
  propPayments.forEach(p => {
    const month = p.date?.slice(0, 7) || "Unknown";
    monthlyMap[month] = (monthlyMap[month] || 0) + (p.amount || 0);
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month: month.slice(5) + "/" + month.slice(2,4), amount }));

  // Vacancy loss estimate (vacant units * market rent * 12 months is too speculative; just show vacant units)
  const occupiedCount = units.filter(u => u.status === "occupied").length;
  const vacantCount = units.length - occupiedCount;
  const vacancyLoss = units
    .filter(u => u.status === "vacant")
    .reduce((s, u) => s + (u.rent_amount || 0), 0);

  const Stat = ({ label, value, color }) => (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-outfit font-bold ${color || ""}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Collected (All Time)" value={`$${totalCollected.toLocaleString()}`} color="text-emerald-600" />
        <Stat label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} color="text-red-500" />
        <Stat label="Net Income" value={`$${netIncome.toLocaleString()}`} color={netIncome >= 0 ? "text-emerald-600" : "text-red-500"} />
        <Stat label="Monthly Vacancy Loss" value={`$${vacancyLoss.toLocaleString()}`} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Occupied Units</p>
          <p className="text-xl font-bold text-emerald-600">{occupiedCount} / {units.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Vacant Units</p>
          <p className="text-xl font-bold text-orange-500">{vacantCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Occupancy Rate</p>
          <p className="text-xl font-bold">{units.length ? Math.round(occupiedCount / units.length * 100) : 0}%</p>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Monthly Revenue (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
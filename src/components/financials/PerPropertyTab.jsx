import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Home, Percent } from "lucide-react";

export default function PerPropertyTab({ properties }) {
  const [propertyId, setPropertyId] = useState("");
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    Promise.all([
      base44.entities.Payment.filter({ status: "confirmed" }),
      base44.entities.WorkOrder.filter({ property_id: propertyId }),
      base44.entities.Unit.filter({ property_id: propertyId }),
    ]).then(([pays, wo, u]) => {
      // filter payments by units in this property
      const unitIds = new Set(u.map(x => x.id));
      setPayments(pays.filter(p => unitIds.has(p.unit_id) || !p.unit_id));
      setOrders(wo);
      setUnits(u);
      setLoading(false);
    });
  }, [propertyId]);

  const prop = properties.find(p => p.id === propertyId);

  const totalIncome = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = orders.reduce((s, o) => s + (o.cost || 0), 0);
  const netIncome = totalIncome - totalExpenses;
  const vacantUnits = units.filter(u => u.status === "vacant").length;
  const vacancyRate = units.length > 0 ? ((vacantUnits / units.length) * 100).toFixed(1) : 0;

  // month-by-month chart
  const byMonth = {};
  payments.forEach(p => {
    const m = p.date?.slice(0, 7); if (!m) return;
    byMonth[m] = byMonth[m] || { month: m.slice(5), income: 0, expenses: 0 };
    byMonth[m].income += p.amount || 0;
  });
  orders.forEach(o => {
    const m = o.created_date?.slice(0, 7); if (!m) return;
    byMonth[m] = byMonth[m] || { month: m.slice(5), income: 0, expenses: 0 };
    byMonth[m].expenses += o.cost || 0;
  });
  const chartData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Select Property</label>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="mt-1 max-w-xs"><SelectValue placeholder="Choose a property…" /></SelectTrigger>
          <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!propertyId && (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground">
          Select a property to view its financial summary.
        </div>
      )}

      {propertyId && loading && (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      )}

      {propertyId && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Rent Collected", value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
              { label: "Net Income", value: `$${netIncome.toLocaleString()}`, icon: TrendingUp, color: netIncome >= 0 ? "text-emerald-600" : "text-red-500", bg: netIncome >= 0 ? "bg-emerald-50" : "bg-red-50" },
              { label: "Vacancy Rate", value: `${vacancyRate}%`, icon: Home, color: "text-orange-500", bg: "bg-orange-50" },
            ].map(c => (
              <div key={c.label} className="bg-card border border-border rounded-xl p-5">
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <div className="text-2xl font-outfit font-bold">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Monthly Income vs Expenses</h2>
            {chartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No data for this property yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, name) => [`$${v.toLocaleString()}`, name]} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="hsl(160 60% 45%)" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(0 84% 60%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
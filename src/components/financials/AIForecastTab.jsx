import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { Loader2 } from "lucide-react";

export default function AIForecastTab({ accountId }) {
  const [forecastPeriod, setForecastPeriod] = useState("6");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [vacancyAdjustment, setVacancyAdjustment] = useState(0);
  const [rentAdjustment, setRentAdjustment] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Load properties
  useEffect(() => {
    if (!accountId) return;
    base44.entities.Property.filter({ account_id: accountId }).then(setProperties);
  }, [accountId]);

  // Generate forecast
  const generateForecast = async () => {
    if (!accountId) return;
    setLoading(true);

    try {
      const [leases, workOrders, payments, units, tenants] = await Promise.all([
        base44.entities.Lease.filter({ account_id: accountId }),
        base44.entities.WorkOrder.filter({ account_id: accountId }),
        base44.entities.Payment.filter({ status: "confirmed", account_id: accountId }),
        base44.entities.Unit.filter({ account_id: accountId }),
        base44.entities.Tenant.filter({ account_id: accountId }),
      ]);

      // Filter by property if selected
      let filteredLeases = leases;
      let filteredUnits = units;
      let filteredWorkOrders = workOrders;
      let filteredPayments = payments;
      if (propertyFilter) {
        const propUnits = units.filter(u => u.property_id === propertyFilter);
        filteredLeases = leases.filter(l => propUnits.some(u => u.id === l.unit_id));
        filteredUnits = propUnits;
        filteredWorkOrders = workOrders.filter(wo => wo.property_id === propertyFilter);
        filteredPayments = payments.filter(p => propUnits.some(u => u.id === p.unit_id));
      }

      // Historical metrics
      const avgMonthlyRevenue = filteredPayments.length > 0
        ? filteredPayments.reduce((s, p) => s + (p.amount || 0), 0) / Math.max(6, Math.ceil(filteredPayments.length / 10))
        : 0;
      const avgMonthlyExpenses = filteredWorkOrders.length > 0
        ? filteredWorkOrders.reduce((s, wo) => s + (wo.cost || 0), 0) / Math.max(6, Math.ceil(filteredWorkOrders.length / 10))
        : 0;

      // Active leases and rent
      const activeLeases = filteredLeases.filter(l => {
        const end = new Date(l.end_date);
        return end >= new Date();
      });
      const totalActiveRent = activeLeases.reduce((s, l) => s + (l.rent_amount || 0), 0);

      // Build forecast
      const months = parseInt(forecastPeriod);
      const now = new Date();
      const forecast = [];
      let cumulativeRevenue = avgMonthlyRevenue;
      let cumulativeExpenses = avgMonthlyExpenses;

      for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        // Revenue: base rent + renewals (80% default)
        let projectedRev = totalActiveRent * (1 - vacancyAdjustment / 100) * (1 + rentAdjustment / 100);

        // Lease expirations in this month
        const expiringLeases = filteredLeases.filter(l => {
          const end = new Date(l.end_date);
          return end.getMonth() === d.getMonth() && end.getFullYear() === d.getFullYear();
        });
        const renewedRent = expiringLeases.reduce((s, l) => s + (l.rent_amount * 0.8 || 0), 0);
        projectedRev += renewedRent;

        // Expenses: recurring + maintenance trend
        let projectedExp = avgMonthlyExpenses * (1 + vacancyAdjustment / 100);

        forecast.push({
          month: monthKey,
          revenue: Math.round(projectedRev),
          expenses: Math.round(projectedExp),
          revenueHigh: Math.round(projectedRev * 1.15),
          revenueLow: Math.round(projectedRev * 0.85),
          expensesHigh: Math.round(projectedExp * 1.2),
          expensesLow: Math.round(projectedExp * 0.8),
        });

        cumulativeRevenue += projectedRev;
        cumulativeExpenses += projectedExp;
      }

      setChartData(forecast);
      setData({
        totalProjectedRevenue: forecast.reduce((s, m) => s + m.revenue, 0),
        totalProjectedExpenses: forecast.reduce((s, m) => s + m.expenses, 0),
        activeLeaseCount: activeLeases.length,
        expiringLeaseCount: filteredLeases.filter(l => {
          const end = new Date(l.end_date);
          const in6Months = new Date();
          in6Months.setMonth(in6Months.getMonth() + 6);
          return end >= new Date() && end <= in6Months;
        }).length,
      });
    } catch (err) {
      console.error("Forecast error:", err);
    }

    setLoading(false);
  };

  // Generate forecast on mount and when filters change
  useEffect(() => {
    if (accountId) {
      generateForecast();
    }
  }, [accountId, propertyFilter, forecastPeriod]);

  const projectedNetProfit = data ? data.totalProjectedRevenue - data.totalProjectedExpenses : 0;
  const confidenceScore = data?.activeLeaseCount > 5 && data?.totalProjectedRevenue > 0 ? "High" : data?.activeLeaseCount > 0 ? "Medium" : "Low";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Forecast Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Forecast Period</label>
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Property</label>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address.split(',')[0]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button onClick={generateForecast} disabled={loading} className="w-full mt-6 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Generating..." : "Regenerate Forecast"}
            </Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Revenue & Expense Projection</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="revenueHigh" fill="#86EFAC" stroke="none" opacity={0.1} name="Revenue Range" />
              <Area type="monotone" dataKey="revenueLow" fill="#86EFAC" stroke="none" opacity={0.1} />
              <Line type="monotone" dataKey="revenue" stroke="#059669" strokeDasharray="5 5" name="Projected Revenue" dot={{ r: 4 }} />
              <Area type="monotone" dataKey="expensesHigh" fill="#FECACA" stroke="none" opacity={0.1} name="Expense Range" />
              <Area type="monotone" dataKey="expensesLow" fill="#FECACA" stroke="none" opacity={0.1} />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeDasharray="5 5" name="Projected Expenses" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Projected Revenue</p>
            <p className="text-xl font-bold text-emerald-700">${(data.totalProjectedRevenue / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Projected Expenses</p>
            <p className="text-xl font-bold text-red-700">${(data.totalProjectedExpenses / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Projected Net Profit</p>
            <p className="text-xl font-bold" style={{ color: projectedNetProfit >= 0 ? '#059669' : '#DC2626' }}>
              ${(projectedNetProfit / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Forecast Confidence</p>
            <p className="text-xl font-bold text-purple-700">{confidenceScore}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.activeLeaseCount} active leases</p>
          </div>
        </div>
      )}

      {/* What-If Scenarios */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">What-If Scenarios</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Vacancy Rate Adjustment</label>
              <span className="text-sm font-semibold text-amber-600">{vacancyAdjustment}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={vacancyAdjustment}
              onChange={(e) => setVacancyAdjustment(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">Simulates increased vacancy impact on revenue</p>
          </div>
          <div>
            <label className="text-sm font-medium">Rent Increase Adjustment</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min="0"
                max="20"
                value={rentAdjustment}
                onChange={(e) => setRentAdjustment(Number(e.target.value))}
                placeholder="0"
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
              />
              <span className="flex items-center text-sm font-semibold">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Simulates rent increase or market adjustment</p>
          </div>
        </div>
      </div>

      {/* Forecast Events */}
      {data && data.expiringLeaseCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-900">⚠️ Upcoming Lease Expirations</p>
          <p className="text-sm text-blue-700 mt-1">{data.expiringLeaseCount} lease(s) expiring in the next 6 months. Plan for potential non-renewals or renegotiations.</p>
        </div>
      )}
    </div>
  );
}
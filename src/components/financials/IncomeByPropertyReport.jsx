import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function IncomeByPropertyReport({ payments, workOrders, properties }) {
  // Aggregate revenue and expenses by property
  const propertyData = properties.map(prop => {
    const propPayments = payments.filter(p => {
      const unit = { property_id: prop.id };
      return unit.property_id === prop.id;
    });
    const propExpenses = workOrders.filter(wo => wo.property_id === prop.id);
    
    const revenue = propPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const expenses = propExpenses.reduce((s, wo) => s + (wo.cost || 0), 0);
    
    return {
      id: prop.id,
      name: prop.nickname || prop.address.split(',')[0],
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  }).sort((a, b) => b.profit - a.profit);

  const totalRevenue = propertyData.reduce((s, p) => s + p.revenue, 0);
  const totalExpenses = propertyData.reduce((s, p) => s + p.expenses, 0);
  const totalProfit = propertyData.reduce((s, p) => s + p.profit, 0);

  return (
    <div className="space-y-6">
      {/* Report */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-2" size="sm">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" className="gap-2" size="sm">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold" style={{ color: '#059669' }}>${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold" style={{ color: '#DC2626' }}>${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>${totalProfit.toLocaleString()}</p>
          </div>
        </div>

        {/* Chart */}
        {propertyData.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Revenue, Expenses & Profit by Property</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#059669" name="Revenue" />
                <Bar dataKey="expenses" fill="#DC2626" name="Expenses" />
                <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div>
          <h3 className="font-semibold mb-4">Property Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Property</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium">Expenses</th>
                  <th className="text-right px-4 py-3 font-medium">Net Profit</th>
                  <th className="text-right px-4 py-3 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {propertyData.map((prop) => {
                  const margin = prop.revenue > 0 ? ((prop.profit / prop.revenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={prop.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium">{prop.name}</td>
                      <td className="text-right px-4 py-3 font-semibold" style={{ color: '#059669' }}>
                        ${prop.revenue.toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold" style={{ color: '#DC2626' }}>
                        ${prop.expenses.toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold" style={{ color: prop.profit >= 0 ? '#059669' : '#DC2626' }}>
                        ${prop.profit.toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 text-xs text-muted-foreground">
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border font-bold bg-secondary/50">
                  <td className="px-4 py-3">Total</td>
                  <td className="text-right px-4 py-3" style={{ color: '#059669' }}>
                    ${totalRevenue.toLocaleString()}
                  </td>
                  <td className="text-right px-4 py-3" style={{ color: '#DC2626' }}>
                    ${totalExpenses.toLocaleString()}
                  </td>
                  <td className="text-right px-4 py-3" style={{ color: totalProfit >= 0 ? '#059669' : '#DC2626' }}>
                    ${totalProfit.toLocaleString()}
                  </td>
                  <td className="text-right px-4 py-3 text-xs">
                    {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
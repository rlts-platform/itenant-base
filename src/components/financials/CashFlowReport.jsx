import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

export default function CashFlowReport({ payments, workOrders, properties }) {
  const [dateRange, setDateRange] = useState("month");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateRange = () => {
    const now = new Date();
    let start, end = now;
    
    if (dateRange === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === "lastMonth") {
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (dateRange === "quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (dateRange === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(customStart);
      end = new Date(customEnd);
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Build month-by-month breakdown
  const monthData = {};
  let current = new Date(start);
  while (current <= end) {
    const key = current.toISOString().slice(0, 7);
    monthData[key] = { month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), in: 0, out: 0 };
    current.setMonth(current.getMonth() + 1);
  }

  // Populate cash in/out by month
  payments.forEach(p => {
    if (!propertyFilter || properties.find(pr => pr.id === propertyFilter)?.id === propertyFilter) {
      const key = p.date?.slice(0, 7);
      if (monthData[key]) monthData[key].in += (p.amount || 0);
    }
  });

  workOrders.forEach(wo => {
    if (!propertyFilter || wo.property_id === propertyFilter) {
      const key = wo.created_date?.slice(0, 7);
      if (monthData[key]) monthData[key].out += (wo.cost || 0);
    }
  });

  const months = Object.values(monthData);
  const totalIn = months.reduce((s, m) => s + m.in, 0);
  const totalOut = months.reduce((s, m) => s + m.out, 0);
  const netCashFlow = totalIn - totalOut;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Property</Label>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {dateRange === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
        )}
      </div>

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
            <p className="text-xs text-muted-foreground mb-1">Cash In</p>
            <p className="text-2xl font-bold" style={{ color: '#059669' }}>${totalIn.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Cash Out</p>
            <p className="text-2xl font-bold" style={{ color: '#DC2626' }}>${totalOut.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Net Cash Flow</p>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>${netCashFlow.toLocaleString()}</p>
          </div>
        </div>

        {/* Month-by-month table */}
        <div>
          <h3 className="font-semibold mb-4">Month-by-Month Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Month</th>
                  <th className="text-right px-4 py-3 font-medium">Cash In</th>
                  <th className="text-right px-4 py-3 font-medium">Cash Out</th>
                  <th className="text-right px-4 py-3 font-medium">Net Flow</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">{m.month}</td>
                    <td className="text-right px-4 py-3 font-semibold" style={{ color: '#059669' }}>${m.in.toLocaleString()}</td>
                    <td className="text-right px-4 py-3 font-semibold" style={{ color: '#DC2626' }}>${m.out.toLocaleString()}</td>
                    <td className="text-right px-4 py-3 font-semibold" style={{ color: m.in - m.out >= 0 ? '#059669' : '#DC2626' }}>
                      ${(m.in - m.out).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
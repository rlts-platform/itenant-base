import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

const INCOME_CATEGORIES = [
  "Rent Income", "Late Fees", "Pet Rent", "Parking", "Security Deposit", "Application Fees", "Other Income"
];

const EXPENSE_CATEGORIES = [
  "Repairs & Maintenance", "Property Insurance", "Property Taxes", "Management Fees", "Utilities",
  "Mortgage / Loan Payment", "Landscaping", "Cleaning", "Advertising / Listings", "Legal & Professional Fees",
  "Capital Improvements", "Other Expense"
];

export default function ProfitLossReport({ payments, workOrders, properties }) {
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

  // Filter payments and work orders by date and property
  const filteredPayments = payments.filter(p => {
    const pDate = new Date(p.date);
    const propMatch = !propertyFilter || properties.find(pr => pr.id === propertyFilter)?.id === propertyFilter;
    return pDate >= start && pDate <= end && propMatch;
  });

  const filteredWorkOrders = workOrders.filter(wo => {
    const woDate = new Date(wo.created_date);
    const propMatch = !propertyFilter || wo.property_id === propertyFilter;
    return woDate >= start && woDate <= end && propMatch;
  });

  // Aggregate income and expenses by category
  const incomeByCategory = {};
  INCOME_CATEGORIES.forEach(cat => { incomeByCategory[cat] = 0; });
  filteredPayments.forEach(p => {
    const cat = p.category || "Rent Income";
    incomeByCategory[cat] = (incomeByCategory[cat] || 0) + (p.amount || 0);
  });

  const expenseByCategory = {};
  EXPENSE_CATEGORIES.forEach(cat => { expenseByCategory[cat] = 0; });
  filteredWorkOrders.forEach(wo => {
    const cat = wo.category || "Repairs & Maintenance";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (wo.cost || 0);
  });

  const totalIncome = Object.values(incomeByCategory).reduce((s, v) => s + v, 0);
  const totalExpenses = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);
  const noi = totalIncome - totalExpenses;

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

        {/* Income Section */}
        <div>
          <h3 className="font-semibold mb-4">Income by Category</h3>
          <div className="space-y-2">
            {INCOME_CATEGORIES.map(cat => (
              <div key={cat} className="flex justify-between text-sm py-2 border-b border-border">
                <span>{cat}</span>
                <span className="font-semibold">${(incomeByCategory[cat] || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-base font-bold py-3 border-t-2 border-border mt-4">
            <span>Total Income</span>
            <span style={{ color: '#059669' }}>${totalIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Expense Section */}
        <div>
          <h3 className="font-semibold mb-4">Expenses by Category</h3>
          <div className="space-y-2">
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat} className="flex justify-between text-sm py-2 border-b border-border">
                <span>{cat}</span>
                <span className="font-semibold">${(expenseByCategory[cat] || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-base font-bold py-3 border-t-2 border-border mt-4">
            <span>Total Expenses</span>
            <span style={{ color: '#DC2626' }}>${totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Net Operating Income (NOI)</span>
            <span className="font-bold">${noi.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Net Profit</span>
            <span style={{ color: noi >= 0 ? '#059669' : '#DC2626' }}>${noi.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
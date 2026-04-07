import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Download, FileText } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Repairs & Maintenance", "Property Insurance", "Property Taxes", "Management Fees",
  "Utilities", "Mortgage / Loan Payment", "Landscaping", "Cleaning", "Advertising / Listings",
  "Legal & Professional Fees", "Capital Improvements", "Other Expense"
];

export default function TaxEstimatorTab({ accountId, properties, payments, workOrders, vendors }) {
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [deductibleExpenses, setDeductibleExpenses] = useState({});
  const [estimatedAnnualIncome, setEstimatedAnnualIncome] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProperty, setFilterProperty] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("year");

  const now = new Date();
  const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  // Tax summary calculations
  const yearlyPayments = payments.filter(p => p.date?.startsWith(selectedYear));
  const yearlyExpenses = workOrders.filter(wo => wo.created_date?.startsWith(selectedYear));

  const totalRentalIncome = yearlyPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalDeductions = yearlyExpenses.reduce((s, wo) => s + (wo.cost || 0), 0);
  const netTaxableIncome = Math.max(0, totalRentalIncome - totalDeductions);

  // Deductible expenses by category
  const expenseByCategory = {};
  EXPENSE_CATEGORIES.forEach(cat => { expenseByCategory[cat] = 0; });
  yearlyExpenses.forEach(wo => {
    const cat = wo.category || "Other Expense";
    if (EXPENSE_CATEGORIES.includes(cat)) {
      expenseByCategory[cat] += (wo.cost || 0);
    }
  });

  // Deductible expenses table filtering
  const getFilteredExpenses = () => {
    let filtered = yearlyExpenses;
    if (filterCategory) filtered = filtered.filter(wo => wo.category === filterCategory);
    if (filterProperty) filtered = filtered.filter(wo => wo.property_id === filterProperty);
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  // Vendor 1099 data
  const getVendor1099Data = () => {
    const vendorPayments = {};
    yearlyExpenses.forEach(wo => {
      if (wo.assigned_vendor_id) {
        vendorPayments[wo.assigned_vendor_id] = (vendorPayments[wo.assigned_vendor_id] || 0) + (wo.cost || 0);
      }
    });

    return vendors
      .filter(v => (vendorPayments[v.id] || 0) >= 600)
      .map(v => ({
        ...v,
        totalPaid: vendorPayments[v.id] || 0,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);
  };

  const vendor1099s = getVendor1099Data();

  // Quarterly estimate
  const quarterlyPayment = netTaxableIncome > 0 ? Math.round(netTaxableIncome * 0.25 / 4) : 0;

  // Export deductions
  const handleExportDeductions = () => {
    const headers = ["Date", "Vendor/Description", "Category", "Amount", "Property"];
    const rows = filteredExpenses.map(wo => [
      wo.created_date || "",
      (vendors.find(v => v.id === wo.assigned_vendor_id)?.name || wo.summary || ""),
      wo.category || "Other",
      wo.cost || 0,
      properties.find(p => p.id === wo.property_id)?.nickname || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Deductible-Expenses-${selectedYear}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* SECTION 1: TAX SUMMARY */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium whitespace-nowrap">Tax Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Rental Income</p>
            <p className="text-2xl font-bold text-emerald-700">${totalRentalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Deductible Expenses</p>
            <p className="text-2xl font-bold text-red-700">${totalDeductions.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-1">Est. Net Taxable Income</p>
            <p className="text-2xl font-bold text-blue-700">${netTaxableIncome.toLocaleString()}</p>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Deductible Expense Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat} className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg">
                <span className="text-muted-foreground">{cat}</span>
                <span className="font-semibold">${(expenseByCategory[cat] || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: DEDUCTIBLE EXPENSES TRACKER */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Deductible Expenses Tracker</h2>
        
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Property</Label>
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Properties</SelectItem>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address.split(',')[0]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportDeductions} variant="outline" className="w-full gap-2" size="sm">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Property</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No expenses found</td></tr>
              ) : (
                filteredExpenses.map(wo => (
                  <tr key={wo.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 text-xs">{wo.created_date || "—"}</td>
                    <td className="px-4 py-3">{vendors.find(v => v.id === wo.assigned_vendor_id)?.name || wo.summary || "—"}</td>
                    <td className="px-4 py-3 text-xs">{wo.category || "Other"}</td>
                    <td className="px-4 py-3 text-xs">{properties.find(p => p.id === wo.property_id)?.nickname || "—"}</td>
                    <td className="text-right px-4 py-3 font-semibold">${(wo.cost || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: QUARTERLY ESTIMATES */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quarterly Estimated Tax Payments</h2>
        
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">This is a rough estimate using a 25% effective rate. Consult a CPA for accurate quarterly payments based on your specific tax situation.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { quarter: "Q1", dueDate: "Apr 15", payment: quarterlyPayment },
              { quarter: "Q2", dueDate: "Jun 15", payment: quarterlyPayment },
              { quarter: "Q3", dueDate: "Sep 15", payment: quarterlyPayment },
              { quarter: "Q4", dueDate: "Jan 15", payment: quarterlyPayment },
            ].map(q => (
              <div key={q.quarter} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-semibold">{q.quarter}</p>
                <p className="text-xs text-muted-foreground">Due {q.dueDate}</p>
                <p className="text-xl font-bold text-slate-700 mt-2">${q.payment.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-sm font-semibold">Estimated Annual Tax: <span className="text-lg text-blue-700">${(quarterlyPayment * 4).toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      {/* SECTION 4: 1099 GENERATOR */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1099-NEC Generator</h2>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">1099-NEC forms are due to vendors by January 31.</p>
            <p className="mt-1">IRS penalties range from $60–$310 per form for late filing.</p>
          </div>
        </div>

        {vendor1099s.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-muted-foreground">
            <p>No vendors with $600+ payments found for {selectedYear}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Vendor Name</th>
                    <th className="text-left px-4 py-3 font-medium">EIN/SSN</th>
                    <th className="text-right px-4 py-3 font-medium">Total Paid</th>
                    <th className="text-center px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor1099s.map(v => (
                    <tr key={v.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="text-slate-400">(Add EIN/SSN)</span>
                      </td>
                      <td className="text-right px-4 py-3 font-semibold">${v.totalPaid.toLocaleString()}</td>
                      <td className="text-center px-4 py-3">
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <FileText className="w-3 h-3" /> Generate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Download All as ZIP
              </Button>
              <Button className="gap-2">
                <FileText className="w-4 h-4" /> Generate All 1099s
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* DISCLAIMER */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-muted-foreground">
        <p>This tool helps organize your financial data for tax preparation. Consult a qualified CPA for tax advice specific to your situation.</p>
      </div>
    </div>
  );
}
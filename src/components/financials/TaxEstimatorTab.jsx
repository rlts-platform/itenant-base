import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";

const BRACKETS_2024 = [
  { rate: 0.10, upTo: 11600 },
  { rate: 0.12, upTo: 47150 },
  { rate: 0.22, upTo: 100525 },
  { rate: 0.24, upTo: 191950 },
  { rate: 0.32, upTo: 243725 },
  { rate: 0.35, upTo: 609350 },
  { rate: 0.37, upTo: Infinity },
];

const MISSED_DEDUCTIONS = [
  "Home office deduction (if managing from home)",
  "Vehicle mileage for property visits & errands",
  "Travel expenses for out-of-town properties",
  "Legal & professional fees (attorneys, accountants)",
  "Education & training related to rental activity",
  "Tenant screening & background check fees",
  "Bank fees and service charges",
  "Software & subscription tools (property management apps)",
  "Depreciation on appliances & improvements",
  "Partial-year expenses for newly acquired properties",
];

function estimateBracket(income) {
  if (income <= 0) return { rate: 0, label: "0%" };
  let remaining = income;
  let prev = 0;
  for (const b of BRACKETS_2024) {
    if (remaining <= b.upTo - prev) return { rate: b.rate, label: `${(b.rate * 100).toFixed(0)}%` };
    remaining -= (b.upTo - prev);
    prev = b.upTo;
  }
  return { rate: 0.37, label: "37%" };
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));

export default function TaxEstimatorTab() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState({
    repairs: "", depreciation: "", property_tax: "", mortgage_interest: "",
    insurance: "", professional_fees: "", management_fees: "", utilities: "", advertising: "",
  });

  useEffect(() => {
    base44.entities.Payment.filter({ status: "confirmed" }).then(p => { setPayments(p); setLoading(false); });
  }, []);

  const yearlyIncome = payments
    .filter(p => p.date?.startsWith(year))
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalDeductions = Object.values(expenses).reduce((s, v) => s + (Number(v) || 0), 0);
  const netTaxable = Math.max(0, yearlyIncome - totalDeductions);
  const bracket = estimateBracket(netTaxable);
  const estimatedTax = netTaxable * bracket.rate;

  const expenseFields = [
    { key: "repairs", label: "Repairs & Maintenance" },
    { key: "depreciation", label: "Estimated Depreciation" },
    { key: "property_tax", label: "Property Tax Paid" },
    { key: "mortgage_interest", label: "Mortgage Interest" },
    { key: "insurance", label: "Insurance Premiums" },
    { key: "professional_fees", label: "Professional Fees" },
    { key: "management_fees", label: "Management Fees" },
    { key: "utilities", label: "Utilities Paid by Owner" },
    { key: "advertising", label: "Advertising" },
  ];

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Disclaimer */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">This estimate is for planning purposes only. Consult a licensed CPA or tax professional for accurate filing.</p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium whitespace-nowrap">Tax Year</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Income summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-1">Total Rental Income — {year}</h2>
        <div className="text-3xl font-outfit font-bold text-emerald-600">${yearlyIncome.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">Based on confirmed payments</p>
      </div>

      {/* Deductible expenses */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold">Deductible Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expenseFields.map(f => (
            <div key={f.key}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-6"
                  value={expenses[f.key]}
                  onChange={e => setExpenses(ex => ({ ...ex, [f.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm font-medium">Total Deductions</span>
          <span className="font-bold text-red-600">− ${totalDeductions.toLocaleString()}</span>
        </div>
      </div>

      {/* Net & bracket */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Net Taxable Income</div>
          <div className="text-2xl font-outfit font-bold">${netTaxable.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Est. Federal Tax Bracket</div>
          <div className="text-2xl font-outfit font-bold text-orange-600">{bracket.label}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Rough Tax Estimate</div>
          <div className="text-2xl font-outfit font-bold text-red-600">${estimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Missed deductions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold">Commonly Missed Deductions</h2>
        </div>
        <ul className="space-y-1.5">
          {MISSED_DEDUCTIONS.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">•</span> {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
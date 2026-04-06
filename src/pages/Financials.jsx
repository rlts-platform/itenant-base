import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, TrendingDown, Upload, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import PerPropertyTab from "../components/financials/PerPropertyTab";
import TaxEstimatorTab from "../components/financials/TaxEstimatorTab";
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import ViewOnlyBanner from "../components/ViewOnlyBanner";

const TABS = [
  { id: "trends",      label: "Trends" },
  { id: "forecast",    label: "AI Forecast" },
  { id: "categories",  label: "Categories" },
  { id: "reports",     label: "Reports" },
  { id: "invoices",    label: "Invoices" },
  { id: "budgets",     label: "Budgets" },
  { id: "recurring",   label: "Recurring" },
  { id: "payments",    label: "Payments" },
  { id: "banking",     label: "Banking" },
  { id: "taxes",       label: "Taxes" },
  { id: "all",         label: "All Records" },
];

const REPORT_CARDS = [
  { title: "Rent Roll",          desc: "All units, tenants, rent amounts & status" },
  { title: "Income Statement",   desc: "Revenue vs expenses summary" },
  { title: "Vacancy Report",     desc: "Vacant units & revenue loss estimate" },
  { title: "Maintenance Cost",   desc: "Work order costs by category" },
  { title: "Payment History",    desc: "All confirmed payments by tenant" },
  { title: "Year-End Summary",   desc: "Annual income & expense overview" },
];

const INCOME_CATEGORIES = [
  { name: "Rent Income", color: "#10B981" },
  { name: "Late Fees", color: "#FBBF24" },
  { name: "Pet Rent", color: "#3B82F6" },
  { name: "Parking", color: "#9CA3AF" },
  { name: "Security Deposit", color: "#8B5CF6" },
  { name: "Application Fees", color: "#F97316" },
  { name: "Other Income", color: "#9CA3AF" },
];

const EXPENSE_CATEGORIES = [
  { name: "Repairs & Maintenance", color: "#EF4444" },
  { name: "Property Insurance", color: "#3B82F6" },
  { name: "Property Taxes", color: "#374151" },
  { name: "Management Fees", color: "#8B5CF6" },
  { name: "Utilities", color: "#F97316" },
  { name: "Mortgage / Loan Payment", color: "#1E40AF" },
  { name: "Landscaping", color: "#10B981" },
  { name: "Cleaning", color: "#14B8A6" },
  { name: "Advertising / Listings", color: "#EC4899" },
  { name: "Legal & Professional Fees", color: "#9CA3AF" },
  { name: "Capital Improvements", color: "#FBBF24" },
  { name: "Other Expense", color: "#9CA3AF" },
];

export default function Financials() {
  const { accountId } = useAccount();
  const { canWrite } = usePermissions('financials');
  const [tab, setTab] = useState("trends");
  const [payments, setPayments] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customType, setCustomType] = useState("income");
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#7C6FCD");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      base44.entities.Payment.filter({ status: "confirmed", account_id: accountId }),
      base44.entities.WorkOrder.filter({ account_id: accountId }),
      base44.entities.Property.filter({ account_id: accountId }),
    ]).then(([p, wo, props]) => { setPayments(p); setWorkOrders(wo); setProperties(props); setLoading(false); });
  }, [accountId]);

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = workOrders.reduce((s, wo) => s + (wo.cost || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Build 6-month revenue vs expenses chart
  const sixMonthData = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.toISOString().slice(0, 7);
    sixMonthData[m] = { month: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, expenses: 0 };
  }
  payments.forEach(p => {
    const m = p.date?.slice(0, 7);
    if (sixMonthData[m]) sixMonthData[m].revenue += (p.amount || 0);
  });
  workOrders.forEach(wo => {
    const m = wo.created_date?.slice(0, 7);
    if (sixMonthData[m]) sixMonthData[m].expenses += (wo.cost || 0);
  });
  const chartData = Object.values(sixMonthData);

  const handleAddCustomCategory = async () => {
    if (!customName.trim()) return;
    setSaving(true);
    // Save to account custom categories (simplified - can be extended to persist)
    setSaving(false);
    setCustomModalOpen(false);
    setCustomName("");
    setCustomColor("#7C6FCD");
    setCustomType("income");
  };

  const CategoryCard = ({ category, monthAmount = 0, ytdAmount = 0 }) => (
    <div className="bg-white border border-border rounded-lg p-4 flex items-start gap-3">
      <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: category.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#1A1A2E' }}>{category.name}</p>
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <div>
            <p className="text-muted-foreground text-xs">This Month</p>
            <p className="font-semibold" style={{ color: '#1A1A2E' }}>${monthAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">YTD</p>
            <p className="font-semibold" style={{ color: '#1A1A2E' }}>${ytdAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with title, subtitle, and action buttons */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Financial Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button style={{ backgroundColor: '#059669', color: 'white', border: 'none' }} className="gap-2">
            + Add Transaction
          </Button>
        </div>
      </div>

      {!canWrite && <ViewOnlyBanner />}

      {/* KPI Cards */}
      <div className="space-y-3">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#059669' }}>${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <TrendingUp className="w-8 h-8" style={{ color: '#059669' }} />
          </div>
        </div>
        {/* Total Expenses */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#DC2626' }}>${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <TrendingDown className="w-8 h-8" style={{ color: '#DC2626' }} />
          </div>
        </div>
        {/* Net Profit */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #D1FAE5' }}>
          <p className="text-sm text-muted-foreground mb-2">Net Profit</p>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-outfit font-bold" style={{ color: '#059669' }}>${netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <DollarSign className="w-8 h-8" style={{ color: '#059669' }} />
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Revenue vs Expenses (Last 6 Months)</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#059669" dot={{ fill: '#059669', r: 5 }} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" dot={{ fill: '#DC2626', r: 5 }} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "trends" && (
        <div className="text-center py-12 text-muted-foreground">
          Trends tab content coming soon
        </div>
      )}

      {tab === "forecast" && (
        <div className="text-center py-12 text-muted-foreground">
          AI Forecast tab content coming soon
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Income Categories</h2>
                <div className="space-y-3">
                  {INCOME_CATEGORIES.map(cat => (
                    <CategoryCard key={cat.name} category={cat} monthAmount={0} ytdAmount={0} />
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 mt-4"
                onClick={() => { setCustomType("income"); setCustomModalOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Add Custom Income Category
              </Button>
            </div>

            {/* Expense Categories */}
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Expense Categories</h2>
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <CategoryCard key={cat.name} category={cat} monthAmount={0} ytdAmount={0} />
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 mt-4"
                onClick={() => { setCustomType("expense"); setCustomModalOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Add Custom Expense Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="text-center py-12 text-muted-foreground">
          Invoices tab content coming soon
        </div>
      )}

      {tab === "budgets" && (
        <div className="text-center py-12 text-muted-foreground">
          Budgets tab content coming soon
        </div>
      )}

      {tab === "recurring" && (
        <div className="text-center py-12 text-muted-foreground">
          Recurring tab content coming soon
        </div>
      )}

      {tab === "payments" && (
        <div className="text-center py-12 text-muted-foreground">
          Payments tab content coming soon
        </div>
      )}

      {tab === "banking" && (
        <div className="text-center py-12 text-muted-foreground">
          Banking tab content coming soon
        </div>
      )}

      {tab === "taxes" && <TaxEstimatorTab />}

      {tab === "all" && (
        <div className="text-center py-12 text-muted-foreground">
          All Records tab content coming soon
        </div>
      )}
    </div>

    {/* Custom Category Modal */}
    <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Category Name</Label>
            <Input
              className="mt-1"
              placeholder="e.g., HOA Fees"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={customType} onValueChange={setCustomType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                style={{ backgroundColor: customColor }}
                onClick={() => {
                  const colors = ["#EF4444", "#F97316", "#FBBF24", "#10B981", "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899", "#9CA3AF"];
                  setCustomColor(colors[Math.floor(Math.random() * colors.length)]);
                }}
              />
              <Input
                type="text"
                placeholder="#7C6FCD"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCustomModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomCategory} disabled={saving || !customName.trim()}>
              {saving ? "Saving..." : "Add Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
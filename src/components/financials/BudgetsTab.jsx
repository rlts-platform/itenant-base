import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const INCOME_CATEGORIES = ["Rent Income", "Late Fees", "Pet Rent", "Parking", "Security Deposit", "Application Fees", "Other Income"];
const EXPENSE_CATEGORIES = ["Repairs & Maintenance", "Property Insurance", "Property Taxes", "Management Fees", "Utilities", "Mortgage / Loan Payment", "Landscaping", "Cleaning", "Advertising / Listings", "Legal & Professional Fees", "Capital Improvements", "Other Expense"];

export default function BudgetsTab({ accountId, properties, payments, workOrders }) {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetProperty, setBudgetProperty] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState("monthly");
  const [budgetAmounts, setBudgetAmounts] = useState({});

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load budgets
  useEffect(() => {
    if (!accountId) return;
    base44.entities.Budget.filter({ account_id: accountId }).then(data => {
      setBudgets(data);
      if (data.length > 0) setSelectedBudgetId(data[0].id);
      setLoading(false);
    });
  }, [accountId]);

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);

  const handleCreateBudget = async () => {
    if (!budgetName.trim()) return;
    setSaving(true);

    const newBudget = await base44.entities.Budget.create({
      name: budgetName,
      property_id: budgetProperty || null,
      account_id: accountId,
      period: budgetPeriod,
      year_month: budgetPeriod === "monthly" ? currentYearMonth : String(now.getFullYear()),
      categories: budgetAmounts,
      alert_threshold: 80,
      is_active: true,
    });

    setBudgets([...budgets, newBudget]);
    setSelectedBudgetId(newBudget.id);
    setSaving(false);
    setModalOpen(false);
    setBudgetName("");
    setBudgetProperty("");
    setBudgetPeriod("monthly");
    setBudgetAmounts({});
  };

  const calculateActuals = () => {
    if (!selectedBudget) return {};

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentYear = now.getFullYear();

    let relevantPayments = payments;
    let relevantExpenses = workOrders;

    if (selectedBudget.property_id) {
      const propUnits = properties.find(p => p.id === selectedBudget.property_id)?.id;
      relevantPayments = payments.filter(p => p.property_id === propUnits);
      relevantExpenses = workOrders.filter(wo => wo.property_id === selectedBudget.property_id);
    }

    const actuals = {};

    // Income actuals
    INCOME_CATEGORIES.forEach(cat => {
      let sum = 0;
      if (selectedBudget.period === "monthly") {
        sum = relevantPayments
          .filter(p => p.date?.startsWith(currentMonth))
          .reduce((s, p) => s + (p.amount || 0), 0);
      } else {
        sum = relevantPayments
          .filter(p => p.date?.startsWith(String(currentYear)))
          .reduce((s, p) => s + (p.amount || 0), 0);
      }
      actuals[cat] = sum;
    });

    // Expense actuals (approximate by category if available, otherwise sum all)
    EXPENSE_CATEGORIES.forEach(cat => {
      let sum = 0;
      if (selectedBudget.period === "monthly") {
        sum = relevantExpenses
          .filter(wo => wo.created_date?.startsWith(currentMonth))
          .reduce((s, wo) => s + (wo.cost || 0), 0);
      } else {
        sum = relevantExpenses
          .filter(wo => wo.created_date?.startsWith(String(currentYear)))
          .reduce((s, wo) => s + (wo.cost || 0), 0);
      }
      actuals[cat] = sum;
    });

    return actuals;
  };

  const actuals = calculateActuals();

  const getBudgetedCategories = () => {
    if (!selectedBudget) return [];
    return Object.keys(selectedBudget.categories || {}).map(cat => ({
      name: cat,
      budgeted: selectedBudget.categories[cat],
      actual: actuals[cat] || 0,
    }));
  };

  const categories = getBudgetedCategories();
  const totalBudgeted = categories.reduce((s, c) => s + c.budgeted, 0);
  const totalActual = categories.reduce((s, c) => s + c.actual, 0);
  const totalRemaining = totalBudgeted - totalActual;
  const overBudgetCount = categories.filter(c => c.actual > c.budgeted).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Create Budget Button */}
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Budget
        </Button>
      </div>

      {/* Budget Selector */}
      {budgets.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-4">
          <Label className="text-sm font-medium">Select Budget</Label>
          <Select value={selectedBudgetId || ""} onValueChange={setSelectedBudgetId}>
            <SelectTrigger className="mt-2 w-full md:w-64">
              <SelectValue placeholder="Choose a budget" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.period})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Budget View */}
      {selectedBudget ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: '#1A1A2E' }}>{selectedBudget.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedBudget.period === "monthly" ? `${currentYearMonth}` : now.getFullYear()}
                  {selectedBudget.property_id && properties.find(p => p.id === selectedBudget.property_id) && ` • ${properties.find(p => p.id === selectedBudget.property_id)?.nickname || "Property"}`}
                </p>
              </div>
              {overBudgetCount > 0 && (
                <div className="px-3 py-1 bg-red-100 border border-red-300 rounded-full text-xs font-semibold text-red-700">
                  ⚠️ {overBudgetCount} over budget
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
              <p className="text-2xl font-bold text-blue-700">${totalBudgeted.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Actual</p>
              <p className="text-2xl font-bold text-slate-700">${totalActual.toLocaleString()}</p>
            </div>
            <div className={`rounded-lg p-4 border ${totalRemaining >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-muted-foreground mb-1">Total Remaining</p>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                ${totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Budget Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-right px-4 py-3 font-medium">Budgeted</th>
                  <th className="text-right px-4 py-3 font-medium">Actual</th>
                  <th className="text-right px-4 py-3 font-medium">Remaining</th>
                  <th className="text-left px-4 py-3 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No budget categories created yet</td></tr>
                ) : (
                  categories.map(cat => {
                    const percentUsed = cat.budgeted > 0 ? Math.round((cat.actual / cat.budgeted) * 100) : 0;
                    const isOver = cat.actual > cat.budgeted;
                    const isWarning = percentUsed >= 80 && !isOver;
                    let barColor = "#10B981"; // green
                    if (isOver) barColor = "#DC2626"; // red
                    else if (isWarning) barColor = "#FBBF24"; // yellow
                    return (
                      <tr key={cat.name} className="border-b border-border hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium">{cat.name}</td>
                        <td className="text-right px-4 py-3">${cat.budgeted.toLocaleString()}</td>
                        <td className="text-right px-4 py-3 font-semibold">${cat.actual.toLocaleString()}</td>
                        <td className={`text-right px-4 py-3 font-semibold ${isOver ? "text-red-700" : "text-emerald-700"}`}>
                          ${Math.abs(cat.budgeted - cat.actual).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{ width: `${Math.min(percentUsed, 100)}%`, backgroundColor: barColor }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-12 text-right">{percentUsed}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-muted-foreground mb-4">No budgets created yet.</p>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Your First Budget
          </Button>
        </div>
      )}

      {/* Create Budget Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Budget Name</Label>
              <Input
                className="mt-1"
                placeholder="e.g., 2026 Annual Budget"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property</Label>
                <Select value={budgetProperty} onValueChange={setBudgetProperty}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Properties</SelectItem>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address.split(',')[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period</Label>
                <Select value={budgetPeriod} onValueChange={setBudgetPeriod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Income Categories */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Expected Income</h3>
              <div className="space-y-2">
                {INCOME_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <label className="text-sm flex-1">{cat}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-32"
                      value={budgetAmounts[cat] || ""}
                      onChange={(e) => setBudgetAmounts(prev => ({ ...prev, [cat]: Number(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Budgeted Expenses</h3>
              <div className="space-y-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <label className="text-sm flex-1">{cat}</label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-32"
                      value={budgetAmounts[cat] || ""}
                      onChange={(e) => setBudgetAmounts(prev => ({ ...prev, [cat]: Number(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBudget} disabled={saving || !budgetName.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Creating..." : "Create Budget"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
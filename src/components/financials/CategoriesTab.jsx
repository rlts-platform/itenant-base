import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const currentYear = String(now.getFullYear());

const INCOME_CATEGORIES = [
  { name: "Rent Income",       color: "#10B981" },
  { name: "Late Fees",         color: "#FBBF24" },
  { name: "Pet Rent",          color: "#3B82F6" },
  { name: "Parking",           color: "#9CA3AF" },
  { name: "Security Deposit",  color: "#8B5CF6" },
  { name: "Application Fees",  color: "#F97316" },
  { name: "Other Income",      color: "#6B7280" },
];

const EXPENSE_CATEGORIES = [
  { name: "Repairs & Maintenance",    color: "#EF4444" },
  { name: "Property Insurance",       color: "#3B82F6" },
  { name: "Property Taxes",           color: "#374151" },
  { name: "Management Fees",          color: "#8B5CF6" },
  { name: "Utilities",                color: "#F97316" },
  { name: "Mortgage / Loan Payment",  color: "#1E40AF" },
  { name: "Landscaping",              color: "#10B981" },
  { name: "Cleaning",                 color: "#14B8A6" },
  { name: "Advertising / Listings",   color: "#EC4899" },
  { name: "Legal & Professional Fees",color: "#9CA3AF" },
  { name: "Capital Improvements",     color: "#FBBF24" },
  { name: "Other Expense",            color: "#6B7280" },
];

const PRESET_COLORS = [
  "#EF4444","#F97316","#FBBF24","#10B981","#14B8A6",
  "#3B82F6","#8B5CF6","#EC4899","#374151","#9CA3AF","#6B7280"
];

function calcTotals(payments, workOrders, categoryName, type) {
  let month = 0, ytd = 0;
  if (type === "income") {
    payments.forEach(p => {
      const cat = p.category || "Rent Income";
      if (cat !== categoryName) return;
      const amt = p.amount || 0;
      if (p.date?.startsWith(currentMonth)) month += amt;
      if (p.date?.startsWith(currentYear)) ytd += amt;
    });
  } else {
    workOrders.forEach(wo => {
      const cat = wo.category || "Repairs & Maintenance";
      if (cat !== categoryName) return;
      const amt = wo.cost || 0;
      if (wo.created_date?.startsWith(currentMonth)) month += amt;
      if (wo.created_date?.startsWith(currentYear)) ytd += amt;
    });
  }
  return { month, ytd };
}

function CategoryRow({ cat, payments, workOrders, type }) {
  const { month, ytd } = calcTotals(payments, workOrders, cat.name, type);
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/20">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
      <span className="flex-1 text-sm font-medium" style={{ color: '#1A1A2E' }}>{cat.name}</span>
      <div className="text-right w-28">
        <p className="text-xs text-muted-foreground">This Month</p>
        <p className="text-sm font-semibold">${month.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="text-right w-28">
        <p className="text-xs text-muted-foreground">YTD</p>
        <p className="text-sm font-semibold">${ytd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
    </div>
  );
}

export default function CategoriesTab({ payments, workOrders }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [customType, setCustomType] = useState("income");
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#7C6FCD");
  const [customIncome, setCustomIncome] = useState([]);
  const [customExpense, setCustomExpense] = useState([]);

  const handleAdd = () => {
    if (!customName.trim()) return;
    const entry = { name: customName.trim(), color: customColor };
    if (customType === "income") setCustomIncome(p => [...p, entry]);
    else setCustomExpense(p => [...p, entry]);
    setCustomName("");
    setCustomColor("#7C6FCD");
    setModalOpen(false);
  };

  const incomeCategories = [...INCOME_CATEGORIES, ...customIncome];
  const expenseCategories = [...EXPENSE_CATEGORIES, ...customExpense];

  return (
    <div className="space-y-6">
      {/* Income */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b border-border">
          <h3 className="font-semibold text-sm" style={{ color: '#065F46' }}>Income Categories</h3>
        </div>
        {incomeCategories.map(cat => (
          <CategoryRow key={cat.name} cat={cat} payments={payments} workOrders={workOrders} type="income" />
        ))}
        <div className="px-4 py-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setCustomType("income"); setModalOpen(true); }}>
            <Plus className="w-3 h-3" /> Add Custom Category
          </Button>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-red-50 border-b border-border">
          <h3 className="font-semibold text-sm" style={{ color: '#7F1D1D' }}>Expense Categories</h3>
        </div>
        {expenseCategories.map(cat => (
          <CategoryRow key={cat.name} cat={cat} payments={payments} workOrders={workOrders} type="expense" />
        ))}
        <div className="px-4 py-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setCustomType("expense"); setModalOpen(true); }}>
            <Plus className="w-3 h-3" /> Add Custom Category
          </Button>
        </div>
      </div>

      {/* Add Custom Category Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input className="mt-1" placeholder="e.g., HOA Fees" value={customName} onChange={e => setCustomName(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={customType} onValueChange={setCustomType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCustomColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: customColor === c ? '#1A1A2E' : 'transparent' }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-7 h-7 rounded-full border border-border shrink-0" style={{ backgroundColor: customColor }} />
                <Input
                  className="font-mono text-sm"
                  placeholder="#7C6FCD"
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!customName.trim()}>Add Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
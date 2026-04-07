import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Plus, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";

const ALL_CATEGORIES = [
  "Rent Income", "Late Fees", "Pet Rent", "Parking", "Security Deposit", "Application Fees", "Other Income",
  "Repairs & Maintenance", "Property Insurance", "Property Taxes", "Management Fees", "Utilities",
  "Mortgage / Loan Payment", "Landscaping", "Cleaning", "Advertising / Listings",
  "Legal & Professional Fees", "Capital Improvements", "Other Expense",
];

const INCOME_CATEGORIES = [
  "Rent Income", "Late Fees", "Pet Rent", "Parking", "Security Deposit", "Application Fees", "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Repairs & Maintenance", "Property Insurance", "Property Taxes", "Management Fees", "Utilities",
  "Mortgage / Loan Payment", "Landscaping", "Cleaning", "Advertising / Listings",
  "Legal & Professional Fees", "Capital Improvements", "Other Expense",
];

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 opacity-80" />
    : <ChevronDown className="w-3 h-3 opacity-80" />;
}

export default function AllRecordsTab({ payments, workOrders, properties, units, accountId, onTransactionAdded }) {
  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterProperty, setFilterProperty] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");

  // Sort
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  // Add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: "Rent Income",
    property_id: "",
    unit_id: "",
    amount: "",
    type: "income",
    notes: "",
    receipt_url: "",
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Merge payments + workOrders into unified rows
  const allRows = useMemo(() => {
    const incomeRows = payments.map(p => {
      const unit = units.find(u => u.id === p.unit_id);
      const prop = properties.find(pr => pr.id === unit?.property_id);
      return {
        id: `pay-${p.id}`,
        date: p.date || "",
        description: p.description || "Rent Payment",
        category: p.category || "Rent Income",
        property_id: unit?.property_id || "",
        propertyName: prop?.nickname || prop?.address?.split(",")[0] || "—",
        unit_id: p.unit_id || "",
        unitNumber: unit?.unit_number || "—",
        type: "income",
        amount: p.amount || 0,
        source: "Payment",
      };
    });

    const expenseRows = workOrders.map(wo => {
      const prop = properties.find(pr => pr.id === wo.property_id);
      const unit = units.find(u => u.id === wo.unit_id);
      return {
        id: `wo-${wo.id}`,
        date: wo.created_date?.slice(0, 10) || "",
        description: wo.summary || "—",
        category: wo.category || "Repairs & Maintenance",
        property_id: wo.property_id || "",
        propertyName: prop?.nickname || prop?.address?.split(",")[0] || "—",
        unit_id: wo.unit_id || "",
        unitNumber: unit?.unit_number || "—",
        type: "expense",
        amount: wo.cost || 0,
        source: "Work Order",
      };
    });

    return [...incomeRows, ...expenseRows];
  }, [payments, workOrders, properties, units]);

  // Apply filters
  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (search && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (filterProperty && r.property_id !== filterProperty) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterType && r.type !== filterType) return false;
      return true;
    });
  }, [allRows, search, dateFrom, dateTo, filterProperty, filterCategory, filterType]);

  // Apply sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "amount") { av = Number(av); bv = Number(bv); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const clearFilters = () => {
    setSearch(""); setDateFrom(""); setDateTo("");
    setFilterProperty(""); setFilterCategory(""); setFilterType("");
  };

  const hasFilters = search || dateFrom || dateTo || filterProperty || filterCategory || filterType;

  const exportCSV = () => {
    const headers = ["Date", "Description", "Category", "Property", "Unit", "Type", "Amount", "Source"];
    const rows = sorted.map(r => [
      r.date, r.description, r.category, r.propertyName, r.unitNumber,
      r.type, r.amount, r.source,
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "transactions.csv";
    a.click();
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReceipt(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, receipt_url: file_url }));
    setUploadingReceipt(false);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.date) return;
    setSaving(true);
    if (form.type === "income") {
      await base44.entities.Payment.create({
        description: form.description,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        method: "manual",
        status: "confirmed",
        property_id: form.property_id || null,
        unit_id: form.unit_id || null,
        notes: form.notes || null,
        proof_image_url: form.receipt_url || null,
        account_id: accountId,
        tenant_id: "manual",
      });
    } else {
      await base44.entities.WorkOrder.create({
        summary: form.description,
        category: form.category,
        cost: Number(form.amount),
        property_id: form.property_id || null,
        unit_id: form.unit_id || null,
        notes: form.notes || null,
        receipt_url: form.receipt_url || null,
        urgency: "normal",
        status: "closed",
        account_id: accountId,
      });
    }
    setSaving(false);
    setModalOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), description: "", category: "Rent Income", property_id: "", unit_id: "", amount: "", type: "income", notes: "", receipt_url: "" });
    onTransactionAdded?.();
  };

  const filteredUnits = form.property_id ? units.filter(u => u.property_id === form.property_id) : units;
  const availableCategories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const SortableTh = ({ col, label, right }) => (
    <th
      className={`px-4 py-3 font-medium cursor-pointer select-none hover:bg-secondary/70 ${right ? "text-right" : "text-left"}`}
      onClick={() => handleSort(col)}
    >
      <div className={`flex items-center gap-1 ${right ? "justify-end" : ""}`}>
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A2E' }}>All Transactions</h2>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">From</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
          </div>
          <Select value={filterProperty} onValueChange={setFilterProperty}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Properties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Properties</SelectItem>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address?.split(",")[0]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Categories</SelectItem>
              {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={exportCSV}>
            <Download className="w-3 h-3" /> Export CSV
          </Button>
        </div>
        {sorted.length > 0 && (
          <p className="text-xs text-muted-foreground">{sorted.length} transaction{sorted.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <SortableTh col="date" label="Date" />
                <SortableTh col="description" label="Description" />
                <SortableTh col="category" label="Category" />
                <SortableTh col="propertyName" label="Property" />
                <SortableTh col="unitNumber" label="Unit" />
                <SortableTh col="type" label="Type" />
                <SortableTh col="amount" label="Amount" right />
                <SortableTh col="source" label="Source" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-muted-foreground">
                    {hasFilters
                      ? "No transactions match your filters."
                      : "No transactions yet. Add your first transaction to get started."}
                  </td>
                </tr>
              ) : (
                sorted.map(row => (
                  <tr key={row.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3 text-xs">{row.date || "—"}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{row.description}</td>
                    <td className="px-4 py-3 text-xs">{row.category}</td>
                    <td className="px-4 py-3 text-xs">{row.propertyName}</td>
                    <td className="px-4 py-3 text-xs">{row.unitNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        row.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {row.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {row.type === "expense" ? "-" : ""}${(row.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" className="mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, category: v === "income" ? "Rent Income" : "Repairs & Maintenance" }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input className="mt-1" placeholder="e.g., Rent Payment - Unit 2A" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v, unit_id: "" }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address?.split(",")[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit (optional)</Label>
                <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {filteredUnits.map(u => <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Amount ($)</Label>
              <Input type="number" className="mt-1" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>

            <div>
              <Label>Notes</Label>
              <Input className="mt-1" placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div>
              <Label>Receipt</Label>
              <div className="mt-1">
                {form.receipt_url ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 font-medium">✓ Uploaded</span>
                    <button className="text-xs text-muted-foreground underline" onClick={() => setForm(f => ({ ...f, receipt_url: "" }))}>Remove</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    {uploadingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {uploadingReceipt ? "Uploading..." : "Upload receipt"}
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleReceiptUpload} disabled={uploadingReceipt} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.description || !form.amount || !form.date}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Transaction"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const CATEGORIES = ["Roof", "HVAC", "Plumbing", "Electrical", "Flooring", "Exterior", "Addition", "Other"];
const STATUSES = ["Planned", "In Progress", "Complete"];
const IRS_USEFUL_LIFE = 27.5; // years for residential improvements

export default function CapExTracker({ accountId, properties }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    description: "",
    property_id: "",
    date_started: "",
    estimated_cost: "",
    actual_cost: "",
    contractor: "",
    category: "Other",
    status: "Planned",
    notes: "",
  });

  useEffect(() => {
    if (!accountId) return;
    base44.entities.CapExItem.filter({ account_id: accountId }).then(data => {
      setItems(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    });
  }, [accountId]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ description: "", property_id: "", date_started: "", estimated_cost: "", actual_cost: "", contractor: "", category: "Other", status: "Planned", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      description: item.description || "",
      property_id: item.property_id || "",
      date_started: item.date_started || "",
      estimated_cost: item.estimated_cost || "",
      actual_cost: item.actual_cost || "",
      contractor: item.contractor || "",
      category: item.category || "Other",
      status: item.status || "Planned",
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.property_id) return;
    setSaving(true);
    const data = {
      ...form,
      estimated_cost: Number(form.estimated_cost) || 0,
      actual_cost: Number(form.actual_cost) || 0,
      account_id: accountId,
    };
    if (editItem) {
      const updated = await base44.entities.CapExItem.update(editItem.id, data);
      setItems(items.map(i => i.id === editItem.id ? updated : i));
    } else {
      const created = await base44.entities.CapExItem.create(data);
      setItems([created, ...items]);
    }
    setSaving(false);
    setModalOpen(false);
  };

  // Depreciation calc
  const calcDepreciation = (item) => {
    const cost = item.actual_cost || item.estimated_cost || 0;
    const annualDep = cost / IRS_USEFUL_LIFE;
    const started = item.date_started ? new Date(item.date_started) : null;
    if (!started || item.status !== "Complete") return { annualDep, totalDep: 0, bookValue: cost };
    const yearsElapsed = Math.min((new Date() - started) / (365.25 * 24 * 3600 * 1000), IRS_USEFUL_LIFE);
    const totalDep = Math.min(annualDep * yearsElapsed, cost);
    const bookValue = Math.max(cost - totalDep, 0);
    return { annualDep, totalDep, bookValue };
  };

  // Summary
  const totalInvested = items.reduce((s, i) => s + (i.actual_cost || i.estimated_cost || 0), 0);
  const totalDepreciated = items.reduce((s, i) => s + calcDepreciation(i).totalDep, 0);
  const totalBookValue = items.reduce((s, i) => s + calcDepreciation(i).bookValue, 0);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">CapEx / Renovation Tracker</h3>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add CapEx Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-indigo-700">${totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Depreciated</p>
          <p className="text-2xl font-bold text-amber-700">${totalDepreciated.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Book Value</p>
          <p className="text-2xl font-bold text-emerald-700">${totalBookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-muted-foreground">
        Depreciation uses straight-line method over 27.5 years (IRS useful life for residential improvements). Applies only to completed items.
      </div>

      {/* CapEx Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Property</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Est. Cost</th>
                <th className="text-right px-4 py-3 font-medium">Actual Cost</th>
                <th className="text-right px-4 py-3 font-medium">Annual Dep.</th>
                <th className="text-right px-4 py-3 font-medium">Book Value</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-muted-foreground">No CapEx items yet</td></tr>
              ) : (
                items.map(item => {
                  const prop = properties.find(p => p.id === item.property_id);
                  const dep = calcDepreciation(item);
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium max-w-[150px] truncate">{item.description}</td>
                      <td className="px-4 py-3 text-xs">{prop?.nickname || prop?.address?.split(",")[0] || "—"}</td>
                      <td className="px-4 py-3 text-xs">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          item.status === "Complete" ? "bg-emerald-100 text-emerald-700" :
                          item.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{item.status}</span>
                      </td>
                      <td className="text-right px-4 py-3">${(item.estimated_cost || 0).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 font-semibold">${(item.actual_cost || 0).toLocaleString()}</td>
                      <td className="text-right px-4 py-3 text-xs text-amber-700">${dep.annualDep.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</td>
                      <td className="text-right px-4 py-3 text-xs text-emerald-700">${dep.bookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(item)} className="text-xs text-primary hover:underline">Edit</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit CapEx Item" : "Add CapEx Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Input className="mt-1" placeholder="e.g., Roof replacement" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address?.split(",")[0]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date Started</Label>
                <Input className="mt-1" type="date" value={form.date_started} onChange={e => setForm(f => ({ ...f, date_started: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Cost ($)</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))} />
              </div>
              <div>
                <Label>Actual Cost ($)</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.actual_cost} onChange={e => setForm(f => ({ ...f, actual_cost: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Contractor</Label>
              <Input className="mt-1" placeholder="Contractor name" value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.description || !form.property_id}>
                {saving ? "Saving..." : editItem ? "Update" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
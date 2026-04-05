import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Zap, Flame, Droplets, Wifi, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UTILITY_ICONS = {
  Electric: { icon: Zap, bg: "bg-yellow-100", color: "text-yellow-600" },
  Gas: { icon: Flame, bg: "bg-orange-100", color: "text-orange-600" },
  Water: { icon: Droplets, bg: "bg-blue-100", color: "text-blue-600" },
  Internet: { icon: Wifi, bg: "bg-violet-100", color: "text-violet-600" },
  Other: { icon: Receipt, bg: "bg-gray-100", color: "text-gray-600" },
};

function getNextDueDate(dueDay) {
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EMPTY = { utility_type: "Electric", provider_name: "", account_number: "", monthly_amount: "", due_day: "1" };

export default function UtilityBillsTracker({ tenantId }) {
  const [bills, setBills] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.UtilityBill.filter({ tenant_id: tenantId });
    setBills(data);
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const save = async () => {
    setSaving(true);
    await base44.entities.UtilityBill.create({
      ...form,
      tenant_id: tenantId,
      monthly_amount: Number(form.monthly_amount),
      due_day: Number(form.due_day),
    });
    setSaving(false);
    setOpen(false);
    setForm(EMPTY);
    load();
  };

  const remove = async (id) => { await base44.entities.UtilityBill.delete(id); load(); };

  const totalMonthly = bills.reduce((s, b) => s + (b.monthly_amount || 0), 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold">My Bills</h2>
          {bills.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">~${totalMonthly.toLocaleString()}/month total</p>}
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add Bill</Button>
      </div>

      {bills.length === 0 ? (
        <div className="p-10 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No bills tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your utility accounts to see all bills in one place</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5" />Add Bill</Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {bills.map(b => {
            const cfg = UTILITY_ICONS[b.utility_type] || UTILITY_ICONS.Other;
            const Icon = cfg.icon;
            return (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{b.provider_name} <span className="text-muted-foreground font-normal">· {b.utility_type}</span></p>
                  <p className="text-xs text-muted-foreground">Due {getNextDueDate(b.due_day)}{b.account_number ? ` · Acct #${b.account_number}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">${b.monthly_amount?.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                </div>
                <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          <div className="px-5 py-3 bg-secondary/30 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Monthly Total</p>
            <p className="text-sm font-bold">${totalMonthly.toLocaleString()}</p>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Utility Bill</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Utility Type</Label>
              <Select value={form.utility_type} onValueChange={v => setForm(f => ({ ...f, utility_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Electric","Gas","Water","Internet","Other"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Provider Name</Label><Input className="mt-1" placeholder="e.g. Con Edison" value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} /></div>
            <div><Label>Account Number <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1" placeholder="e.g. 123456789" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Avg ($)</Label><Input type="number" className="mt-1" placeholder="120" value={form.monthly_amount} onChange={e => setForm(f => ({ ...f, monthly_amount: e.target.value }))} /></div>
              <div><Label>Due Day of Month</Label><Input type="number" min="1" max="31" className="mt-1" placeholder="15" value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.provider_name || !form.monthly_amount}>{saving ? "Saving…" : "Add Bill"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
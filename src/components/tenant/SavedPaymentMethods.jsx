import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Star, Trash2, CreditCard, Building2, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_ICONS = {
  "Bank Transfer": { icon: Building2, bg: "bg-blue-100", color: "text-blue-600" },
  "Card": { icon: CreditCard, bg: "bg-violet-100", color: "text-violet-600" },
  "Check": { icon: FileText, bg: "bg-amber-100", color: "text-amber-600" },
  "Money Order": { icon: Receipt, bg: "bg-emerald-100", color: "text-emerald-600" },
};

const NEEDS_LAST4 = ["Bank Transfer", "Card"];

const EMPTY = { nickname: "", type: "Bank Transfer", last4: "" };

export default function SavedPaymentMethods({ tenantId }) {
  const [methods, setMethods] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = async () => {
    const data = await base44.entities.SavedPaymentMethod.filter({ tenant_id: tenantId });
    setMethods(data);
  };

  useEffect(() => { if (tenantId) load(); }, [tenantId]);

  const save = async () => {
    setSaving(true);
    const isFirst = methods.length === 0;
    await base44.entities.SavedPaymentMethod.create({
      ...form,
      tenant_id: tenantId,
      last4: NEEDS_LAST4.includes(form.type) ? form.last4 : "",
      is_default: isFirst,
    });
    setSaving(false);
    setOpen(false);
    setForm(EMPTY);
    load();
  };

  const setDefault = async (id) => {
    await Promise.all(methods.map(m =>
      base44.entities.SavedPaymentMethod.update(m.id, { is_default: m.id === id })
    ));
    load();
  };

  const remove = async (id) => {
    await base44.entities.SavedPaymentMethod.delete(id);
    setConfirmRemove(null);
    load();
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold">Saved Payment Methods</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add New</Button>
      </div>

      {methods.length === 0 ? (
        <div className="p-10 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No saved methods yet</p>
          <p className="text-xs text-muted-foreground mt-1">Save a payment method for quick access</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5" />Add Method</Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {methods.map(m => {
            const cfg = TYPE_ICONS[m.type] || TYPE_ICONS["Card"];
            const Icon = cfg.icon;
            return (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{m.nickname}</p>
                    {m.is_default && <span className="text-xs bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5" />Default</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.type}{m.last4 ? ` ···· ${m.last4}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!m.is_default && (
                    <button onClick={() => setDefault(m.id)} className="text-xs text-primary hover:underline font-medium">Set Default</button>
                  )}
                  <button onClick={() => setConfirmRemove(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Method Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nickname</Label><Input className="mt-1" placeholder="e.g. Chase Checking" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, last4: "" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Bank Transfer","Card","Check","Money Order"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {NEEDS_LAST4.includes(form.type) && (
              <div><Label>Last 4 Digits <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1" maxLength={4} placeholder="1234" value={form.last4} onChange={e => setForm(f => ({ ...f, last4: e.target.value }))} /></div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.nickname}>{saving ? "Saving…" : "Save Method"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Remove Payment Method</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to remove this payment method?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => remove(confirmRemove)}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
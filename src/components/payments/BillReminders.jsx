import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const TYPES = { rent_due: "Rent Due", utility: "Utility Bill", lease_renewal: "Lease Renewal" };
const TIMINGS = { "3_days_before": "3 days before", "1_week_before": "1 week before", day_of: "Day of" };

const emptyForm = { reminder_type: "rent_due", timing: "3_days_before", notify_email: true, notify_sms: false, is_active: true };

export default function BillReminders({ tenantId, accountId }) {
  const [reminders, setReminders] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const filter = {};
    if (tenantId) filter.tenant_id = tenantId;
    if (accountId) filter.account_id = accountId;
    const r = await base44.entities.BillReminder.filter(filter);
    setReminders(r);
  };

  useEffect(() => { load(); }, [tenantId, accountId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ reminder_type: r.reminder_type, timing: r.timing, notify_email: !!r.notify_email, notify_sms: !!r.notify_sms, is_active: !!r.is_active });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const data = { ...form, tenant_id: tenantId, account_id: accountId };
    if (editing) await base44.entities.BillReminder.update(editing.id, data);
    else await base44.entities.BillReminder.create(data);
    setSaving(false);
    setOpen(false);
    load();
  };

  const remove = async (id) => { await base44.entities.BillReminder.delete(id); load(); };
  const toggle = async (r) => { await base44.entities.BillReminder.update(r.id, { is_active: !r.is_active }); load(); };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Bill Reminders</h2>
        </div>
        <Button variant="outline" size="sm" onClick={openAdd} className="gap-1.5 h-7 text-xs">
          <Plus className="w-3 h-3" /> Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reminders set. Add one to get notified before bills are due.</p>
      ) : (
        <div className="space-y-2">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <Switch checked={!!r.is_active} onCheckedChange={() => toggle(r)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{TYPES[r.reminder_type]}</span>
                  <Badge variant="secondary" className="text-xs">{TIMINGS[r.timing]}</Badge>
                </div>
                <div className="flex gap-2 mt-0.5">
                  {r.notify_email && <span className="text-xs text-muted-foreground">📧 Email</span>}
                  {r.notify_sms && <span className="text-xs text-muted-foreground">📱 SMS</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Reminder" : "Add Reminder"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reminder Type</Label>
              <Select value={form.reminder_type} onValueChange={v => setForm(f => ({ ...f, reminder_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timing</Label>
              <Select value={form.timing} onValueChange={v => setForm(f => ({ ...f, timing: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIMINGS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notification Method</Label>
              <div className="flex items-center gap-3">
                <Switch checked={form.notify_email} onCheckedChange={v => setForm(f => ({ ...f, notify_email: v }))} />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.notify_sms} onCheckedChange={v => setForm(f => ({ ...f, notify_sms: v }))} />
                <span className="text-sm">SMS</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
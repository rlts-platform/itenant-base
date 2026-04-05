import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecipientSelector from "./RecipientSelector";
import { Loader2 } from "lucide-react";

const TRIGGERS = [
  { value: "payment_event", label: "Payment Event" },
  { value: "work_order_event", label: "Work Order Event" },
  { value: "lease_event", label: "Lease Event" },
  { value: "date_before", label: "Date-Based: X days before" },
  { value: "date_after", label: "Date-Based: X days after" },
  { value: "manual", label: "Manual" },
];
const CONDITIONS = [
  { value: "amount_gt", label: "Amount greater than" },
  { value: "amount_lt", label: "Amount less than" },
  { value: "status_eq", label: "Status equals" },
  { value: "property_is", label: "Property is" },
  { value: "tenant_is", label: "Tenant is" },
];
const ACTIONS = [
  { value: "send_email", label: "Send Email" },
  { value: "send_sms", label: "Send SMS" },
  { value: "create_task", label: "Create Task" },
  { value: "record_note", label: "Record Note" },
  { value: "notify_team", label: "Notify Team Member" },
];
const MERGE_TAGS = [
  { tag: "[Tenant First Name]", label: "First Name" },
  { tag: "[Property Address]",  label: "Property" },
  { tag: "[Unit Number]",       label: "Unit #" },
  { tag: "[Rent Amount]",       label: "Rent $" },
  { tag: "[Due Date]",          label: "Due Date" },
  { tag: "[Lease End Date]",    label: "Lease End" },
  { tag: "[Work Order Issue]",  label: "WO Issue" },
];

const empty = { name: "", trigger_type: "payment_event", condition_field: "amount_gt", condition_value: "", action_type: "send_email", subject: "", body: "" };

export default function CustomRuleBuilder({ open, onClose, tenants, properties, onSave }) {
  const [form, setForm] = useState(empty);
  const [recipients, setRecipients] = useState({ mode: "all" });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const insertTag = (tag) => set("body", form.body + tag);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    await onSave({ ...form, recipients });
    setSaving(false);
    setForm(empty);
    setRecipients({ mode: "all" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle>Create Custom Rule</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <Label className="mb-1.5 block">Rule Name</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. High-value payment alert" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Trigger</Label>
              <Select value={form.trigger_type} onValueChange={v => set("trigger_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Action</Label>
              <Select value={form.action_type} onValueChange={v => set("action_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Condition</Label>
              <Select value={form.condition_field} onValueChange={v => set("condition_field", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Value</Label>
              <Input value={form.condition_value} onChange={e => set("condition_value", e.target.value)} placeholder="e.g. 1000, active…" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Recipients</Label>
            <RecipientSelector value={recipients} onChange={setRecipients} tenants={tenants} properties={properties} />
          </div>

          <div>
            <Label className="mb-1.5 block">Subject</Label>
            <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Message subject…" />
          </div>

          <div>
            <Label className="mb-1.5 block">Message Body</Label>
            <Textarea rows={5} value={form.body} onChange={e => set("body", e.target.value)} placeholder="Write your message…" className="font-mono text-sm" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MERGE_TAGS.map(t => (
                <button key={t.tag} type="button" onClick={() => insertTag(t.tag)}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
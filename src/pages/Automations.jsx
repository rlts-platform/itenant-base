import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Zap, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const TRIGGERS = ["rent_due","lease_expiring","work_order_created","payment_received","tenant_invited"];

export default function Automations() {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", trigger_event: "rent_due", channels: ["email"], subject: "", body: "", is_enabled: true });
  const [loading, setLoading] = useState(true);

  const load = async () => { const r = await base44.entities.AutomationRule.list(); setRules(r); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", trigger_event: "rent_due", channels: ["email"], subject: "", body: "", is_enabled: true }); setOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, trigger_event: r.trigger_event, channels: r.channels || ["email"], subject: r.subject || "", body: r.body || "", is_enabled: !!r.is_enabled }); setOpen(true); };

  const save = async () => {
    if (editing) await base44.entities.AutomationRule.update(editing.id, form);
    else await base44.entities.AutomationRule.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.AutomationRule.delete(id); load(); };
  const toggle = async (r) => { await base44.entities.AutomationRule.update(r.id, { is_enabled: !r.is_enabled }); load(); };

  const toggleChannel = (ch) => setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Automations</h1><p className="text-sm text-muted-foreground mt-1">Auto-send emails and SMS on events</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />New Rule</Button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No automation rules</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />New Rule</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${r.is_enabled ? "bg-primary/10" : "bg-secondary"}`}>
                <Zap className={`w-4 h-4 ${r.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="font-semibold text-sm">{r.name}</h3></div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">{r.trigger_event?.replace(/_/g, " ")}</span>
                  {r.channels?.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={!!r.is_enabled} onCheckedChange={() => toggle(r)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Rule" : "New Automation Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Trigger Event</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channels</Label>
              <div className="flex gap-3 mt-2">
                {["email","sms"].map(ch => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)} className="rounded" />
                    <span className="text-sm capitalize">{ch}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Subject</Label><Input className="mt-1" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label>Message Body</Label><Textarea className="mt-1" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_enabled} onCheckedChange={v => setForm(f => ({ ...f, is_enabled: v }))} /><Label>Enabled</Label></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
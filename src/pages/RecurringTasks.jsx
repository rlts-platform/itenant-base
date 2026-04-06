import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, Wrench, Pencil, Trash2, ToggleLeft, ToggleRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ModalWrapper from "@/components/ModalWrapper";
import FormGrid from "@/components/FormGrid";
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import ViewOnlyBanner from "../components/ViewOnlyBanner";

const CATEGORIES = ["plumbing", "electrical", "hvac", "appliance", "pest", "structural", "other"];
const FREQ_UNITS = ["days", "weeks", "months", "years"];
const CATEGORY_ICONS = { hvac: "❄️", plumbing: "🔧", electrical: "⚡", appliance: "🏠", pest: "🐛", structural: "🏗️", other: "🛠️" };

const PRESETS = [
  { name: "HVAC Filter Change", category: "hvac", frequency_value: 3, frequency_unit: "months", description: "Replace HVAC air filters to maintain air quality and system efficiency." },
  { name: "Pest Inspection", category: "pest", frequency_value: 6, frequency_unit: "months", description: "Scheduled pest inspection and preventive treatment." },
  { name: "Smoke Detector Test", category: "electrical", frequency_value: 6, frequency_unit: "months", description: "Test all smoke detectors and replace batteries as needed." },
  { name: "Plumbing Inspection", category: "plumbing", frequency_value: 1, frequency_unit: "years", description: "Inspect all plumbing fixtures, check for leaks, and clear drains." },
  { name: "Gutter Cleaning", category: "structural", frequency_value: 6, frequency_unit: "months", description: "Clean gutters and downspouts to prevent water damage." },
  { name: "Annual HVAC Service", category: "hvac", frequency_value: 1, frequency_unit: "years", description: "Full HVAC system inspection and service by certified technician." },
];

function calcNextDue(freqValue, freqUnit, fromDate = new Date()) {
  const d = new Date(fromDate);
  if (freqUnit === "days") d.setDate(d.getDate() + freqValue);
  else if (freqUnit === "weeks") d.setDate(d.getDate() + freqValue * 7);
  else if (freqUnit === "months") d.setMonth(d.getMonth() + freqValue);
  else if (freqUnit === "years") d.setFullYear(d.getFullYear() + freqValue);
  return d.toISOString().split("T")[0];
}

const EMPTY_FORM = { name: "", description: "", category: "hvac", urgency: "normal", frequency_value: 3, frequency_unit: "months", property_id: "", assigned_vendor_id: "" };

export default function RecurringTasks() {
  const { accountId } = useAccount();
  const { canWrite } = usePermissions("maintenance");

  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(null);
  const [showPresets, setShowPresets] = useState(false);

  const load = async () => {
    if (!accountId) return;
    const [t, p, v] = await Promise.all([
      base44.entities.RecurringTask.filter({ account_id: accountId }, "-created_date"),
      base44.entities.Property.filter({ account_id: accountId }),
      base44.entities.Vendor.filter({ account_id: accountId }),
    ]);
    setTasks(t); setProperties(p); setVendors(v);
    setLoading(false);
  };

  useEffect(() => { if (accountId) load(); }, [accountId]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description || "", category: t.category, urgency: t.urgency || "normal", frequency_value: t.frequency_value, frequency_unit: t.frequency_unit, property_id: t.property_id || "", assigned_vendor_id: t.assigned_vendor_id || "" });
    setOpen(true);
  };

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, name: preset.name, category: preset.category, frequency_value: preset.frequency_value, frequency_unit: preset.frequency_unit, description: preset.description }));
    setShowPresets(false);
  };

  const save = async () => {
    const nextDue = calcNextDue(Number(form.frequency_value), form.frequency_unit);
    const payload = { ...form, frequency_value: Number(form.frequency_value), next_due_date: nextDue, is_active: true, account_id: accountId };
    if (!payload.property_id) delete payload.property_id;
    if (!payload.assigned_vendor_id) delete payload.assigned_vendor_id;
    if (editing) {
      await base44.entities.RecurringTask.update(editing.id, payload);
    } else {
      await base44.entities.RecurringTask.create(payload);
    }
    setOpen(false);
    load();
  };

  const remove = async (id) => { await base44.entities.RecurringTask.delete(id); load(); };

  const toggleActive = async (task) => {
    await base44.entities.RecurringTask.update(task.id, { is_active: !task.is_active });
    load();
  };

  const generateNow = async (task) => {
    setGenerating(task.id);
    // Create a work order immediately for this task
    await base44.entities.WorkOrder.create({
      summary: task.name,
      description: task.description || "",
      category: task.category,
      urgency: task.urgency || "normal",
      property_id: task.property_id || undefined,
      assigned_vendor_id: task.assigned_vendor_id || undefined,
      status: "new",
      account_id: accountId,
      notify_tenant: true,
    });
    // Update next due date
    const nextDue = calcNextDue(task.frequency_value, task.frequency_unit);
    await base44.entities.RecurringTask.update(task.id, {
      last_generated_date: new Date().toISOString().split("T")[0],
      next_due_date: nextDue,
    });
    setGenerating(null);
    load();
  };

  const getDueStatus = (task) => {
    if (!task.next_due_date) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(task.next_due_date);
    const days = Math.round((due - today) / 86400000);
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "bg-red-100 text-red-700" };
    if (days === 0) return { label: "Due today", color: "bg-orange-100 text-orange-700" };
    if (days <= 30) return { label: `Due in ${days}d`, color: "bg-yellow-100 text-yellow-700" };
    return { label: `Due in ${days}d`, color: "bg-emerald-100 text-emerald-700" };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-outfit font-bold flex items-center gap-2"><CalendarClock className="w-6 h-6 text-primary" />Recurring Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule maintenance tasks that automatically generate work orders on due dates.</p>
          {!canWrite && <ViewOnlyBanner />}
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-2"><RefreshCw className="w-4 h-4" />Presets</Button>
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />New Task</Button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Tasks", value: tasks.filter(t => t.is_active).length, color: "#7C6FCD" },
          { label: "Due This Month", value: tasks.filter(t => { if (!t.next_due_date) return false; const d = new Date(t.next_due_date); const now = new Date(); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length, color: "#F59E0B" },
          { label: "Overdue", value: tasks.filter(t => t.is_active && t.next_due_date && new Date(t.next_due_date) < new Date()).length, color: "#EF4444" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No recurring tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create tasks to auto-generate work orders on a schedule.</p>
          {canWrite && <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />New Task</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const dueStatus = getDueStatus(task);
            const prop = properties.find(p => p.id === task.property_id);
            const vendor = vendors.find(v => v.id === task.assigned_vendor_id);
            return (
              <div key={task.id} className={`bg-card border rounded-xl p-4 flex items-start gap-4 transition-all ${task.is_active ? "border-border" : "border-border opacity-60"}`}>
                <div className="text-2xl mt-0.5">{CATEGORY_ICONS[task.category] || "🛠️"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{task.name}</h3>
                    {!task.is_active && <Badge variant="secondary">Paused</Badge>}
                    {dueStatus && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dueStatus.color}`}>{dueStatus.label}</span>}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="capitalize">Every {task.frequency_value} {task.frequency_unit}</span>
                    <span className="capitalize">{task.category}</span>
                    {prop && <span>📍 {prop.nickname || prop.address}</span>}
                    {vendor && <span>👷 {vendor.name}</span>}
                    {task.next_due_date && <span>Next: {new Date(task.next_due_date).toLocaleDateString()}</span>}
                  </div>
                  {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>}
                </div>
                {canWrite && (
                  <div className="flex gap-1 shrink-0 items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Generate Work Order Now" onClick={() => generateNow(task)} disabled={generating === task.id}>
                      {generating === task.id ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={task.is_active ? "Pause" : "Resume"} onClick={() => toggleActive(task)}>
                      {task.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(task.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Presets Modal */}
      <ModalWrapper open={showPresets} onOpenChange={setShowPresets} title="Common Recurring Tasks" description="Pick a preset to pre-fill the form.">
        <div className="space-y-2">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => { applyPreset(p); setOpen(true); }} className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_ICONS[p.category]}</span>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Every {p.frequency_value} {p.frequency_unit} · {p.category}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ModalWrapper>

      {/* Add/Edit Modal */}
      <ModalWrapper open={open} onOpenChange={setOpen} title={editing ? "Edit Recurring Task" : "New Recurring Task"}>
        <div className="space-y-4">
          <div><Label>Task Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="HVAC Filter Change" /></div>
          <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details about this task..." /></div>
          <FormGrid>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent>
              </Select>
            </div>
          </FormGrid>
          <FormGrid>
            <div><Label>Repeat Every</Label><Input type="number" className="mt-1" min={1} value={form.frequency_value} onChange={e => setForm(f => ({ ...f, frequency_value: e.target.value }))} /></div>
            <div><Label>Unit</Label>
              <Select value={form.frequency_unit} onValueChange={v => setForm(f => ({ ...f, frequency_unit: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{FREQ_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </FormGrid>
          <div><Label>Property (optional)</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All properties" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All properties</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Default Vendor (optional)</Label>
            <Select value={form.assigned_vendor_id} onValueChange={v => setForm(f => ({ ...f, assigned_vendor_id: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="No vendor assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No vendor</SelectItem>
                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.frequency_value && form.frequency_unit && (
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              📅 First work order will be generated on: <strong>{new Date(calcNextDue(Number(form.frequency_value), form.frequency_unit)).toLocaleDateString()}</strong>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!form.name || !form.frequency_value}>Save Task</Button>
        </div>
      </ModalWrapper>
    </div>
  );
}
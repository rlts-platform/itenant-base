import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Wrench, AlertTriangle, Pencil, Trash2, ShoppingCart, Loader2, Flame, History } from "lucide-react";
import ActivityLogHistory from "../components/ActivityLogHistory";
import FindSuppliesPanel from "../components/vendors/FindSuppliesPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["plumbing","electrical","hvac","appliance","pest","structural","other"];
const URGENCY_COLOR = { normal: "secondary", urgent: "outline", emergency: "destructive" };
const STATUS_COLOR = { new: "default", in_progress: "outline", closed: "secondary" };

export default function Maintenance() {
  const [orders, setOrders] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ summary: "", category: "plumbing", urgency: "normal", status: "new", tenant_id: "", unit_id: "", property_id: "", permission_to_enter: false, cost: "" });
  const [loading, setLoading] = useState(true);
  const [suppliesOpen, setSuppliesOpen] = useState(false);
  const [suppliesPrefill, setSuppliesPrefill] = useState("");
  const [triaging, setTriaging] = useState(false);
  const { user } = useAuth();

  const runAITriage = async (summary, description) => {
    const text = `${summary} ${description || ""}`.trim();
    if (!text) return null;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this maintenance request: "${text}"

Return urgency (one of: normal, urgent, emergency) and category (one of: plumbing, electrical, hvac, appliance, pest, structural, other).
Emergency keywords: fire, flood, gas leak, no heat, sewage, security breach.
Urgent: active leaks, broken locks, no hot water, broken AC.
Normal: cosmetic, minor repairs.`,
      response_json_schema: {
        type: "object",
        properties: {
          urgency: { type: "string" },
          category: { type: "string" },
          is_emergency: { type: "boolean" }
        }
      }
    });
    return result;
  };

  const openSupplies = (summary = "") => { setSuppliesPrefill(summary); setSuppliesOpen(true); };

  const load = async () => {
    const [o, t, u, p] = await Promise.all([base44.entities.WorkOrder.list("-created_date"), base44.entities.Tenant.list(), base44.entities.Unit.list(), base44.entities.Property.list()]);
    setOrders(o); setTenants(t); setUnits(u); setProperties(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ summary: "", category: "plumbing", urgency: "normal", status: "new", tenant_id: "", unit_id: "", property_id: "", permission_to_enter: false, cost: "" }); setOpen(true); };
  const openEdit = (o) => { setEditing(o); setForm({ summary: o.summary, category: o.category, urgency: o.urgency, status: o.status, tenant_id: o.tenant_id || "", unit_id: o.unit_id || "", property_id: o.property_id || "", permission_to_enter: !!o.permission_to_enter, cost: o.cost || "" }); setOpen(true); };

  const save = async () => {
    const data = { ...form, cost: form.cost ? Number(form.cost) : undefined };
    if (editing) {
      if (editing.status !== form.status) {
        await base44.entities.ActivityLog.create({
          record_type: "work_order", record_id: editing.id,
          old_status: editing.status, new_status: form.status,
          changed_by: user?.full_name || user?.email || "Unknown",
          changed_at: new Date().toISOString(),
        });
      }
      await base44.entities.WorkOrder.update(editing.id, data);
    } else {
      setTriaging(true);
      const triage = await runAITriage(form.summary, form.description);
      setTriaging(false);
      if (triage) {
        data.urgency = triage.urgency || data.urgency;
        data.category = triage.category || data.category;
        data.ai_emergency = triage.is_emergency || false;
      }
      const created = await base44.entities.WorkOrder.create(data);
      await base44.entities.ActivityLog.create({
        record_type: "work_order", record_id: created.id,
        new_status: data.status || "new",
        changed_by: user?.full_name || user?.email || "Unknown",
        changed_at: new Date().toISOString(),
        notes: "Created",
      });
    }
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.WorkOrder.delete(id); load(); };

  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : "—"; };
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Maintenance</h1><p className="text-sm text-muted-foreground mt-1">{orders.length} work orders</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openSupplies()} className="gap-2"><ShoppingCart className="w-4 h-4" />Find Supplies</Button>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />New Work Order</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {["all","new","in_progress","closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? "bg-primary text-white" : "bg-card border border-border hover:bg-secondary"}`}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Emergency banner */}
      {filtered.some(o => o.ai_emergency && o.status !== "closed") && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3">
          <Flame className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Emergency Alert</p>
            <p className="text-xs text-red-600 mt-0.5">
              {filtered.filter(o => o.ai_emergency && o.status !== "closed").map(o => o.summary).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No work orders</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />New Work Order</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className={`mt-0.5 p-2 rounded-lg ${o.urgency === "emergency" ? "bg-red-50" : o.urgency === "urgent" ? "bg-orange-50" : "bg-yellow-50"}`}>
                <AlertTriangle className={`w-4 h-4 ${o.urgency === "emergency" ? "text-red-600" : o.urgency === "urgent" ? "text-orange-600" : "text-yellow-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {o.ai_emergency && o.status !== "closed" && <Flame className="w-4 h-4 text-red-600 shrink-0" />}
                  <h3 className="font-semibold text-sm">{o.summary}</h3>
                  <Badge variant={URGENCY_COLOR[o.urgency]}>{o.urgency}</Badge>
                  <Badge variant={STATUS_COLOR[o.status]}>{o.status?.replace("_"," ")}</Badge>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{o.category}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                   <span>Tenant: {tenantName(o.tenant_id)}</span>
                   {o.cost && <span>Cost: ${o.cost}</span>}
                   {o.permission_to_enter && <span>✓ Entry permitted</span>}
                </div>
                {o.photo_urls?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {o.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} className="w-12 h-12 object-cover rounded-md border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Find Supplies" onClick={() => openSupplies(o.summary)}><ShoppingCart className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FindSuppliesPanel open={suppliesOpen} onClose={(v) => setSuppliesOpen(v === false ? false : !suppliesOpen)} prefill={suppliesPrefill} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Work Order" : "New Work Order"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {triaging && <div className="flex items-center gap-2 text-sm text-primary"><Loader2 className="w-4 h-4 animate-spin" />AI is triaging this request…</div>}
            <div><Label>Summary</Label><Textarea className="mt-1" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Cost ($)</Label><Input type="number" className="mt-1" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
            </div>
            <div><Label>Tenant</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.permission_to_enter} onCheckedChange={v => setForm(f => ({ ...f, permission_to_enter: v }))} /><Label>Permission to Enter</Label></div>
          </div>
          {editing && (
            <div className="mt-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">History</span>
              </div>
              <ActivityLogHistory recordId={editing.id} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
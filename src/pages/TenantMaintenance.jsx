import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ModalWrapper from "@/components/ModalWrapper";
import FormGrid from "@/components/FormGrid";
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle, X, Upload, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["plumbing","electrical","hvac","appliance","pest","structural","other"];
const URGENCIES = ["normal","urgent","emergency"];

const statusConfig = {
  new: { label: "Awaiting Scheduling", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-700", icon: CheckCircle },
  closed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
};

const urgencyColor = {
  normal: "bg-gray-100 text-gray-600",
  urgent: "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
};

export default function TenantMaintenance() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ summary: "", category: "plumbing", urgency: "normal", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [triaging, setTriaging] = useState(false);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setPhotoUrls(prev => [...prev, ...urls]);
    setUploadingPhotos(false);
  };

  const runAITriage = async (summary, description) => {
    const text = `${summary} ${description}`.trim();
    if (!text) return null;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this maintenance request and classify it. Text: "${text}"

Return urgency (one of: normal, urgent, emergency) and category (one of: plumbing, electrical, hvac, appliance, pest, structural, other).
Emergency examples: fire, flood, gas leak, no heat in winter, sewage backup, security breach, major electrical failure.
Urgent: active leaks, broken locks, no hot water, broken AC in summer.
Normal: cosmetic, minor repairs, slow drains.`,
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

  useEffect(() => {
    async function load() {
      const tenants = await base44.entities.Tenant.filter({ email: user?.email });
      const t = tenants[0];
      setTenant(t);
      if (t) {
        const wo = await base44.entities.WorkOrder.filter({ tenant_id: t.id });
        setOrders(wo.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const submit = async () => {
    setSubmitting(true);
    setTriaging(true);
    // AI triage
    const triage = await runAITriage(form.summary, form.description);
    setTriaging(false);
    const urgency = triage?.urgency || form.urgency;
    const category = triage?.category || form.category;
    const created = await base44.entities.WorkOrder.create({
      summary: form.summary,
      description: form.description,
      category,
      urgency,
      ai_emergency: triage?.is_emergency || false,
      tenant_id: tenant?.id,
      photo_urls: photoUrls,
      status: "new",
    });
    setOpen(false);
    setForm({ summary: "", category: "plumbing", urgency: "normal", description: "" });
    setPhotoUrls([]);
    const wo = await base44.entities.WorkOrder.filter({ tenant_id: tenant?.id });
    setOrders(wo.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-700">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track maintenance issues</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" />New Request</Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No maintenance requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">Submit a request if something needs attention</p>
          <Button onClick={() => setOpen(true)} className="mt-4 gap-2"><Plus className="w-4 h-4" />Submit Request</Button>
        </div>
      ) : (
        <div className="space-y-4">
           {orders.map(o => {
             const s = statusConfig[o.status] || statusConfig.new;
             const Icon = s.icon;
             const daysUnassigned = o.status === "new" && Math.floor((Date.now() - new Date(o.created_date).getTime()) / (1000 * 60 * 60 * 24)) > 3 && !o.assigned_vendor_id;

             return (
               <div key={o.id} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
                 {/* Progress Tracker */}
                 <div className="mb-3">
                   <div className="flex gap-2 mb-2">
                     {["Submitted", "Assigned", "Scheduled", "Completed"].map((step, i) => {
                       const stepStatuses = ["new", "in_progress", "scheduled", "closed"];
                       const isActive = stepStatuses.indexOf(o.status) >= i;
                       const isCompleted = stepStatuses.indexOf(o.status) > i;
                       return (
                         <div key={i} className="flex-1">
                           <div className={`h-2 rounded-full transition-colors ${
                             isCompleted ? "bg-primary" : isActive ? "bg-primary" : "bg-gray-300"
                           }`} />
                           <p className="text-xs font-medium text-gray-600 mt-1 text-center">{step}</p>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Main content */}
                 <div className="flex items-start justify-between gap-3 mb-2" onClick={() => setSelected(o)}>
                   <div className="flex-1 min-w-0">
                     <p className="font-semibold text-sm">{o.summary}</p>
                     <p className="text-xs text-muted-foreground mt-0.5 capitalize">{o.category} · Submitted {new Date(o.created_date).toLocaleDateString()}</p>
                     {o.scheduled_date && <p className="text-xs text-primary font-medium mt-1">📅 Scheduled: {new Date(o.scheduled_date).toLocaleDateString()} ({o.time_window?.replace('_', ' ')})</p>}
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${urgencyColor[o.urgency]}`}>{o.urgency}</span>
                     <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}><Icon className="w-3 h-3" />{s.label}</span>
                     {o.vendor_confirmed && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">✓ Confirmed</span>}
                   </div>
                 </div>

                 {/* Awaiting assignment warning */}
                 {daysUnassigned && (
                   <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded px-2.5 py-1.5 text-xs mt-2">
                     <Clock className="w-3 h-3 shrink-0" />
                     <span>Awaiting assignment</span>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
      )}

      {/* Submit Dialog */}
      <ModalWrapper open={open} onOpenChange={setOpen} title="Submit Maintenance Request">
          <div className="space-y-4">
            <div><Label>Issue Title</Label><Input className="mt-1" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Kitchen faucet leaking" /></div>
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
                  <SelectContent>{URGENCIES.map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </FormGrid>
            <div><Label>Description</Label><Textarea className="mt-1" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail..." /></div>
            <div>
              <Label>Photos (optional)</Label>
              <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploadingPhotos ? "Uploading…" : "Click to upload photos"}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} className="w-16 h-16 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => setPhotoUrls(p => p.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {triaging && <div className="flex items-center gap-2 text-sm text-primary"><Loader2 className="w-4 h-4 animate-spin" />AI is analyzing your request…</div>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting || !form.summary}>{submitting ? "Submitting..." : "Submit Request"}</Button>
          </div>
      </ModalWrapper>

      {/* Detail Dialog */}
      <ModalWrapper open={!!selected} onOpenChange={() => setSelected(null)} title="Request Details">
          {selected && (
            <div className="space-y-3">
              {selected.ai_emergency && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Emergency — your property manager has been alerted.
                </div>
              )}
              <div><p className="text-xs text-muted-foreground">Issue</p><p className="font-semibold">{selected.summary}</p></div>
              {selected.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{selected.description}</p></div>}
              <div className="flex gap-4">
                <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm capitalize">{selected.category}</p></div>
                <div><p className="text-xs text-muted-foreground">Urgency</p><p className="text-sm capitalize">{selected.urgency}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm capitalize">{selected.status?.replace("_", " ")}</p></div>
              </div>
              {selected.scheduled_date && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-purple-700">Scheduled Information</p>
                  <p className="text-sm text-purple-700">📅 Date: {new Date(selected.scheduled_date).toLocaleDateString()}</p>
                  <p className="text-sm text-purple-700">⏰ Time: {selected.time_window?.replace('_', ' ') || 'Not specified'}</p>
                  {selected.entry_instructions && <p className="text-sm text-purple-700">📋 Entry Instructions: {selected.entry_instructions}</p>}
                  {selected.vendor_confirmed && <p className="text-sm text-green-700 font-medium">✓ Vendor has confirmed this appointment</p>}
                </div>
              )}
              {selected.photo_urls?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} className="w-20 h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-sm">{new Date(selected.created_date).toLocaleString()}</p></div>
              </div>
              )}
              </ModalWrapper>
    </div>
  );
}
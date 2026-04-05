import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["plumbing","electrical","hvac","appliance","pest","structural","other"];
const URGENCIES = ["normal","urgent","emergency"];

const statusConfig = {
  new: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
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
    await base44.entities.WorkOrder.create({
      ...form,
      tenant_id: tenant?.id,
      status: "new",
    });
    setOpen(false);
    setForm({ summary: "", category: "plumbing", urgency: "normal", description: "" });
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
        <div className="space-y-3">
          {orders.map(o => {
            const s = statusConfig[o.status] || statusConfig.new;
            const Icon = s.icon;
            return (
              <div key={o.id} className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(o)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{o.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{o.category} · Submitted {new Date(o.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${urgencyColor[o.urgency]}`}>{o.urgency}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}><Icon className="w-3 h-3" />{s.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Issue Title</Label><Input className="mt-1" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="e.g. Kitchen faucet is leaking" /></div>
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
            <div><Label>Description</Label><Textarea className="mt-1" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail..." /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting || !form.summary}>{submitting ? "Submitting..." : "Submit Request"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div><p className="text-xs text-muted-foreground">Issue</p><p className="font-semibold">{selected.summary}</p></div>
              <div className="flex gap-4">
                <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm capitalize">{selected.category}</p></div>
                <div><p className="text-xs text-muted-foreground">Urgency</p><p className="text-sm capitalize">{selected.urgency}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm capitalize">{selected.status?.replace("_", " ")}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-sm">{new Date(selected.created_date).toLocaleString()}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
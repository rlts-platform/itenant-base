import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, FileText, Pencil, Trash2, CheckCircle, Circle, Sparkles, RefreshCw, History } from "lucide-react";
import ActivityLogHistory from "../components/ActivityLogHistory";
import LeaseGenerator from "../components/LeaseGenerator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const statusColor = { draft: "secondary", active: "default", expired: "outline", terminated: "destructive" };

export default function Leases() {
  const { user } = useAuth();
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tenant_id: "", unit_id: "", start_date: "", end_date: "", rent_amount: "", deposit_amount: "", status: "draft", signed_by_tenant: false, signed_by_client: false });
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [renewData, setRenewData] = useState(null);

  const load = async () => {
    const [l, t, u] = await Promise.all([base44.entities.Lease.list("-created_date"), base44.entities.Tenant.list(), base44.entities.Unit.list()]);
    setLeases(l); setTenants(t); setUnits(u); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ tenant_id: "", unit_id: "", start_date: "", end_date: "", rent_amount: "", deposit_amount: "", status: "draft", signed_by_tenant: false, signed_by_client: false }); setOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ tenant_id: l.tenant_id, unit_id: l.unit_id, start_date: l.start_date, end_date: l.end_date, rent_amount: l.rent_amount || "", deposit_amount: l.deposit_amount || "", status: l.status, signed_by_tenant: !!l.signed_by_tenant, signed_by_client: !!l.signed_by_client }); setOpen(true); };

  const save = async () => {
    const data = { ...form, rent_amount: Number(form.rent_amount), deposit_amount: Number(form.deposit_amount) };
    if (editing) {
      if (editing.status !== form.status) {
        await base44.entities.ActivityLog.create({
          record_type: "lease", record_id: editing.id,
          old_status: editing.status, new_status: form.status,
          changed_by: user?.full_name || user?.email || "Unknown",
          changed_at: new Date().toISOString(),
        });
      }
      await base44.entities.Lease.update(editing.id, data);
    } else {
      const created = await base44.entities.Lease.create(data);
      await base44.entities.ActivityLog.create({
        record_type: "lease", record_id: created.id,
        new_status: data.status,
        changed_by: user?.full_name || user?.email || "Unknown",
        changed_at: new Date().toISOString(),
        notes: "Created",
      });
    }
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.Lease.delete(id); load(); };

  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : "—"; };
  const unitNum = (id) => units.find(u => u.id === id)?.unit_number || "—";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Leases</h1><p className="text-sm text-muted-foreground mt-1">{leases.length} leases</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />New Lease</Button>
          <Button onClick={() => { setRenewData(null); setGenOpen(true); }} className="gap-2"><Sparkles className="w-4 h-4" />Generate Lease</Button>
        </div>
      </div>

      {leases.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No leases yet</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />New Lease</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Tenant", "Unit", "Start", "End", "Rent", "Status", "Signatures", ""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {leases.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium">{tenantName(l.tenant_id)}</td>
                  <td className="px-4 py-3">{unitNum(l.unit_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.start_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.end_date}</td>
                  <td className="px-4 py-3 font-medium">${l.rent_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[l.status] || "secondary"}>{l.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <span className={`flex items-center gap-1 text-xs ${l.signed_by_tenant ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {l.signed_by_tenant ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Tenant
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${l.signed_by_client ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {l.signed_by_client ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Client
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Renew Lease" onClick={() => { setRenewData(l); setGenOpen(true); }}><RefreshCw className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(l.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeaseGenerator
        open={genOpen}
        onClose={() => { setGenOpen(false); setRenewData(null); }}
        onSaved={load}
        renewData={renewData}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Lease" : "New Lease"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Tenant</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Unit</Label>
              <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>Unit {u.unit_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" className="mt-1" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><Label>End Date</Label><Input type="date" className="mt-1" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            <div><Label>Rent Amount</Label><Input type="number" className="mt-1" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))} /></div>
            <div><Label>Deposit Amount</Label><Input type="number" className="mt-1" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["draft","active","expired","terminated"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2"><Switch checked={form.signed_by_tenant} onCheckedChange={v => setForm(f => ({ ...f, signed_by_tenant: v }))} /><Label>Signed by Tenant</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.signed_by_client} onCheckedChange={v => setForm(f => ({ ...f, signed_by_client: v }))} /><Label>Signed by Client</Label></div>
            </div>
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
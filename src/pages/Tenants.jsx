import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Users, Pencil, Trash2, Mail, Phone, Send, Clock } from "lucide-react";
import { useLocation } from "react-router-dom";
import TenantDetail from "./TenantDetail";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", status: "active", unit_id: "" });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [invites, setInvites] = useState([]);
  const [sendingInvite, setSendingInvite] = useState(null);
  const location = useLocation();

  if (selectedId) return <TenantDetail tenantId={selectedId} onBack={() => setSelectedId(null)} />;

  const load = async () => {
    const [t, u, inv] = await Promise.all([
      base44.entities.Tenant.list("-created_date"),
      base44.entities.Unit.list(),
      base44.entities.TenantInvite.list()
    ]);
    setTenants(t); setUnits(u); setInvites(inv); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (location.state?.openAdd) { openAdd(); window.history.replaceState({}, ""); } }, [location.state]);

  const openAdd = () => { setEditing(null); setForm({ first_name: "", last_name: "", email: "", phone: "", status: "active", unit_id: "" }); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ first_name: t.first_name, last_name: t.last_name, email: t.email, phone: t.phone || "", status: t.status, unit_id: t.unit_id || "" }); setOpen(true); };

  const save = async () => {
    let tenantId;
    if (editing) {
      await base44.entities.Tenant.update(editing.id, form);
      tenantId = editing.id;
    } else {
      const created = await base44.entities.Tenant.create({ ...form, status: 'pending' });
      tenantId = created.id;
    }
    setOpen(false);
    // Auto-send invite for new tenants
    if (!editing) {
      await base44.functions.invoke('sendTenantInvite', { tenant_id: tenantId });
    }
    load();
  };

  const resendInvite = async (t) => {
    setSendingInvite(t.id);
    await base44.functions.invoke('sendTenantInvite', { tenant_id: t.id });
    setSendingInvite(null);
    load();
  };

  const getInviteStatus = (tenantId) => {
    const inv = invites
      .filter(i => i.tenant_id === tenantId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    return inv || null;
  };
  const remove = async (id) => { await base44.entities.Tenant.delete(id); load(); };
  const unitName = (id) => units.find(u => u.id === id)?.unit_number || "—";
  const statusColor = { active: "default", inactive: "secondary", pending: "outline" };

  const inviteBadge = (inv) => {
    if (!inv) return null;
    if (inv.status === 'accepted') return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>;
    if (inv.status === 'expired') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Expired</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1"><Send className="w-3 h-3" />Invited</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Tenants</h1><p className="text-sm text-muted-foreground mt-1">{tenants.length} tenants</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Add Tenant</Button>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No tenants yet</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Tenant</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <button onClick={() => setSelectedId(t.id)} className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm hover:ring-2 hover:ring-violet-300 transition-all">
                  {t.first_name?.[0]}{t.last_name?.[0]}
                </button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <button onClick={() => setSelectedId(t.id)} className="font-semibold hover:text-primary transition-colors text-left">{t.first_name} {t.last_name}</button>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{t.email}</div>
                {t.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{t.phone}</div>}
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant={statusColor[t.status] || "secondary"}>{t.status}</Badge>
                {t.unit_id && <span className="text-xs text-muted-foreground">Unit {unitName(t.unit_id)}</span>}
                {inviteBadge(getInviteStatus(t.id))}
              </div>
              {(() => {
                const inv = getInviteStatus(t.id);
                const showResend = !inv || inv.status === 'pending' || inv.status === 'expired';
                if (showResend && inv?.status !== 'accepted') return (
                  <button
                    onClick={() => resendInvite(t)}
                    disabled={sendingInvite === t.id}
                    className="mt-2 text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    {sendingInvite === t.id ? 'Sending…' : inv ? 'Resend Invite' : 'Send Invite'}
                  </button>
                );
                return null;
              })()}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Tenant" : "Add Tenant"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input className="mt-1" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><Label>Last Name</Label><Input className="mt-1" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Unit</Label>
              <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>Unit {u.unit_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
              </Select>
            </div>
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
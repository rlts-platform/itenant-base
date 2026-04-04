import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, CreditCard, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const statusColor = { pending: "outline", confirmed: "default", failed: "destructive" };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ tenant_id: "", amount: "", method: "check", status: "confirmed", date: "", check_number: "" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, t] = await Promise.all([base44.entities.Payment.list("-date"), base44.entities.Tenant.list()]);
    setPayments(p); setTenants(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const openAdd = () => { setEditing(null); setForm({ tenant_id: "", amount: "", method: "check", status: "confirmed", date: today, check_number: "" }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ tenant_id: p.tenant_id, amount: p.amount, method: p.method, status: p.status, date: p.date, check_number: p.check_number || "" }); setOpen(true); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, proof_image_url: file_url }));
    setUploading(false);
  };

  const save = async () => {
    const data = { ...form, amount: Number(form.amount) };
    if (editing) await base44.entities.Payment.update(editing.id, data);
    else await base44.entities.Payment.create(data);
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.Payment.delete(id); load(); };
  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : "—"; };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Payments</h1><p className="text-sm text-muted-foreground mt-1">{payments.length} payments</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Log Payment</Button>
      </div>

      {payments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No payments yet</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Log Payment</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Tenant","Amount","Method","Date","Check #","Status","Proof",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium">{tenantName(p.tenant_id)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.check_number || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[p.status] || "secondary"}>{p.status}</Badge></td>
                  <td className="px-4 py-3">{p.proof_image_url ? <a href={p.proof_image_url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">View</a> : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Payment" : "Log Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tenant</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" className="mt-1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" className="mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label>Method</Label>
                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["check","money_order","cash","zelle"].map(m => <SelectItem key={m} value={m}>{m.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending","confirmed","failed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Check Number</Label><Input className="mt-1" value={form.check_number} onChange={e => setForm(f => ({ ...f, check_number: e.target.value }))} /></div>
            <div>
              <Label>Proof of Payment</Label>
              <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : form.proof_image_url ? "File uploaded ✓" : "Upload proof photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={uploading}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
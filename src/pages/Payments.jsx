import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, CreditCard, Pencil, Trash2, Upload, SplitSquareHorizontal, Calendar, Clock, History } from "lucide-react";
import ExportButton from "../components/ExportButton";
import { formatDate, formatCurrency } from "@/lib/csvExport";
import ActivityLogHistory from "../components/ActivityLogHistory";
import ModalWrapper from "@/components/ModalWrapper";
import FormGrid from "@/components/FormGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import BillReminders from "../components/payments/BillReminders";
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import ViewOnlyBanner from "../components/ViewOnlyBanner";

const statusColor = { pending: "outline", confirmed: "default", failed: "destructive" };
const METHODS = ["check", "money_order", "cash", "zelle"];

export default function Payments() {
  const { user } = useAuth();
  const { accountId, accountLoading } = useAccount();
  const { canWrite } = usePermissions('payments');
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  // Form state
  const emptyForm = { tenant_id: "", amount: "", method: "check", status: "confirmed", date: new Date().toISOString().split("T")[0], check_number: "", proof_image_url: "", proof_upload_date: "", is_split: false, split_amount_2: "", split_method_2: "check", split_proof_url_2: "", split_proof_upload_date_2: "" };
  const [form, setForm] = useState(emptyForm);
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);

  const load = async () => {
    if (!accountId) return;
    const [p, t, pr, u] = await Promise.all([
      base44.entities.Payment.filter({ account_id: accountId }, "-date"),
      base44.entities.Tenant.filter({ account_id: accountId }),
      base44.entities.Property.filter({ account_id: accountId }),
      base44.entities.Unit.filter({ account_id: accountId }),
    ]);
    setPayments(p); setTenants(t); setProperties(pr); setUnits(u); setLoading(false);
  };
  useEffect(() => {
    if (accountId) load();
    else if (!accountLoading) setLoading(false);
  }, [accountId, accountLoading]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      tenant_id: p.tenant_id, amount: p.amount, method: p.method, status: p.status,
      date: p.date, check_number: p.check_number || "",
      proof_image_url: p.proof_image_url || "", proof_upload_date: p.proof_upload_date || "",
      is_split: !!p.is_split,
      split_amount_2: p.split_amount_2 || "", split_method_2: p.split_method_2 || "check",
      split_proof_url_2: p.split_proof_url_2 || "", split_proof_upload_date_2: p.split_proof_upload_date_2 || "",
    });
    setOpen(true);
  };

  const handleFile = async (part) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const now = new Date().toISOString();
    if (part === 1) {
      setUploading1(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, proof_image_url: file_url, proof_upload_date: now }));
      setUploading1(false);
    } else {
      setUploading2(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, split_proof_url_2: file_url, split_proof_upload_date_2: now }));
      setUploading2(false);
    }
  };

  const splitTotal = (Number(form.amount) || 0) + (Number(form.split_amount_2) || 0);
  const totalRentForTenant = () => {
    // can't easily know rent amount here without a lease lookup — just show running total
    return splitTotal;
  };

  const save = async () => {
    const data = {
      ...form,
      amount: Number(form.amount),
      split_amount_2: form.is_split ? Number(form.split_amount_2) : null,
    };
    if (editing) {
      if (editing.status !== form.status) {
        await base44.entities.ActivityLog.create({
          record_type: "payment", record_id: editing.id,
          old_status: editing.status, new_status: form.status,
          changed_by: user?.full_name || user?.email || "Unknown",
          changed_at: new Date().toISOString(),
        });
      }
      await base44.entities.Payment.update(editing.id, data);
    } else {
      const created = await base44.entities.Payment.create({ ...data, account_id: accountId });
      await base44.entities.ActivityLog.create({
        record_type: "payment", record_id: created.id,
        new_status: data.status,
        changed_by: user?.full_name || user?.email || "Unknown",
        changed_at: new Date().toISOString(),
        notes: "Created",
      });
    }
    setOpen(false); load();
  };

  const remove = async (id) => { await base44.entities.Payment.delete(id); load(); };
  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : "—"; };

  const exportPayments = async (exportAll) => {
    const rows = payments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenant_id);
      const unit = units.find(u => u.id === tenant?.unit_id);
      const prop = properties.find(pr => pr.id === unit?.property_id);
      return {
        "Tenant Name": tenant ? `${tenant.first_name} ${tenant.last_name}` : "",
        "Property Address": prop?.address || "",
        "Unit Number": unit?.unit_number || "",
        "Payment Date": formatDate(p.date),
        "Amount Paid": formatCurrency(p.amount),
        "Payment Method": p.method?.replace("_", " ") || "",
        "Proof Uploaded": p.proof_image_url ? "Yes" : "No",
        "Upload Timestamp": p.proof_upload_date ? new Date(p.proof_upload_date).toLocaleString() : "",
        "Status": p.status || "",
        "Notes": ""
      };
    });
    return {
      headers: ["Tenant Name", "Property Address", "Unit Number", "Payment Date", "Amount Paid", "Payment Method", "Proof Uploaded", "Upload Timestamp", "Status", "Notes"],
      rows
    };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-700">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">{payments.length} payments</p>
          {!canWrite && <ViewOnlyBanner />}
        </div>
        <div className="flex gap-2">
          <ExportButton pageName="Payments" onExport={exportPayments} />
          {canWrite && <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Log Payment</Button>}
        </div>
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
              <tr>{["Tenant","Amount","Method","Payment Delivered","Funds Documented","Check #","Status","Proof",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium">{tenantName(p.tenant_id)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-emerald-700">${Number(p.amount).toLocaleString()}</span>
                    {p.is_split && p.split_amount_2 && (
                      <div className="text-xs text-muted-foreground">+${Number(p.split_amount_2).toLocaleString()} split</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {p.method?.replace("_"," ")}
                    {p.is_split && p.split_method_2 && <div className="text-xs text-muted-foreground capitalize">{p.split_method_2.replace("_"," ")}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="text-xs">{p.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.proof_upload_date ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="text-xs">{new Date(p.proof_upload_date).toLocaleDateString()}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.check_number || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[p.status] || "secondary"}>{p.status}</Badge></td>
                  <td className="px-4 py-3">
                    {p.proof_image_url ? <a href={p.proof_image_url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">View</a> : "—"}
                    {p.split_proof_url_2 && <><br/><a href={p.split_proof_url_2} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">View 2</a></>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canWrite && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>}
                      {canWrite && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill Reminders — per selected tenant */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-muted-foreground">View reminders for tenant:</Label>
          <select
            className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            value={selectedTenantId || ""}
            onChange={e => setSelectedTenantId(e.target.value || null)}
          >
            <option value="">— Select tenant —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
        </div>
        {selectedTenantId && (
          <BillReminders tenantId={selectedTenantId} />
        )}
      </div>

      {/* Log Payment Dialog */}
      <ModalWrapper open={open} onOpenChange={setOpen} title={editing ? "Edit Payment" : "Log Payment"}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Tenant</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Split toggle */}
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <SplitSquareHorizontal className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Split Payment</p>
                <p className="text-xs text-muted-foreground">Split across two payment methods</p>
              </div>
              <Switch checked={form.is_split} onCheckedChange={v => setForm(f => ({ ...f, is_split: v }))} />
            </div>

            {/* Part 1 */}
            <div className="space-y-3 border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{form.is_split ? "Part 1" : "Payment Details"}</p>
              <FormGrid>
                <div><Label>Amount ($)</Label><Input type="number" className="mt-1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
                <div><Label>Payment Date</Label><Input type="date" className="mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              </FormGrid>
              <FormGrid>
                <div><Label>Method</Label>
                  <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["pending","confirmed","failed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </FormGrid>
              <div><Label>Check Number</Label><Input className="mt-1" value={form.check_number} onChange={e => setForm(f => ({ ...f, check_number: e.target.value }))} /></div>
              <div>
                <Label>Proof Photo (permanent — cannot be deleted)</Label>
                <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading1 ? "Uploading…" : form.proof_image_url ? "✓ Uploaded" : "Upload proof"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile(1)} disabled={!!form.proof_image_url} />
                </label>
                {form.proof_upload_date && <p className="text-xs text-muted-foreground mt-1">Funds documented: {new Date(form.proof_upload_date).toLocaleString()}</p>}
              </div>
            </div>

            {/* Part 2 — split only */}
            {form.is_split && (
              <div className="space-y-3 border border-primary/30 bg-primary/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Part 2</p>
                <FormGrid>
                  <div><Label>Amount ($)</Label><Input type="number" className="mt-1" value={form.split_amount_2} onChange={e => setForm(f => ({ ...f, split_amount_2: e.target.value }))} placeholder="0.00" /></div>
                  <div><Label>Method</Label>
                    <Select value={form.split_method_2} onValueChange={v => setForm(f => ({ ...f, split_method_2: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m.replace("_"," ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </FormGrid>
                <div>
                  <Label>Proof Photo</Label>
                  <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{uploading2 ? "Uploading…" : form.split_proof_url_2 ? "✓ Uploaded" : "Upload proof"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile(2)} disabled={!!form.split_proof_url_2} />
                  </label>
                  {form.split_proof_upload_date_2 && <p className="text-xs text-muted-foreground mt-1">Funds documented: {new Date(form.split_proof_upload_date_2).toLocaleString()}</p>}
                </div>
                {/* Running total */}
                <div className={`flex items-center justify-between text-sm font-semibold px-3 py-2 rounded-lg ${form.amount && form.split_amount_2 ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                  <span>Combined Total:</span>
                  <span>${splitTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
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
            <Button onClick={save} disabled={uploading1 || uploading2}>Save</Button>
            </div>
            </ModalWrapper>
    </div>
  );
}
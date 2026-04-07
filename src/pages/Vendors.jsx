import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Package, Pencil, Trash2, Star, Phone, Mail, MapPin, ShoppingCart } from "lucide-react";
import FindLocalVendorsPanel from "../components/vendors/FindLocalVendorsPanel";
import FindSuppliesPanel from "../components/vendors/FindSuppliesPanel";
import ModalWrapper from "../components/ModalWrapper";
import FormGrid from "../components/FormGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import ViewOnlyBanner from "../components/ViewOnlyBanner";

const CATEGORIES = ["plumbing","electrical","hvac","cleaning","landscaping","general","other"];

export default function Vendors() {
  const { accountId, accountLoading } = useAccount();
  const { canWrite } = usePermissions('vendors');
  const [vendors, setVendors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [suppliesOpen, setSuppliesOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "general", phone: "", email: "", rating: 5 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!accountId) return;
    const [v, p] = await Promise.all([
      base44.entities.Vendor.filter({ account_id: accountId }),
      base44.entities.Property.filter({ account_id: accountId }),
    ]);
    setVendors(v); setProperties(p); setLoading(false);
  };
  useEffect(() => { if (accountLoading) return; if (accountId) load(); else setLoading(false); }, [accountId, accountLoading]);

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "general", phone: "", email: "", rating: 5 }); setOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ name: v.name, category: v.category, phone: v.phone || "", email: v.email || "", rating: v.rating || 5 }); setOpen(true); };

  const save = async () => {
    const data = { ...form, rating: Number(form.rating) };
    if (editing) await base44.entities.Vendor.update(editing.id, data);
    else await base44.entities.Vendor.create({ ...data, account_id: accountId });
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.Vendor.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-outfit font-700">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">{vendors.length} vendors</p>
          {!canWrite && <ViewOnlyBanner />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSuppliesOpen(true)} className="gap-2 h-11"><ShoppingCart className="w-4 h-4" /><span className="hidden sm:inline">Find Supplies</span></Button>
          <Button variant="outline" onClick={() => setLocalOpen(true)} className="gap-2 h-11"><MapPin className="w-4 h-4" /><span className="hidden sm:inline">Find Vendors</span></Button>
          {canWrite && <Button onClick={openAdd} className="gap-2 h-11 ml-auto"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Vendor</span></Button>}
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No vendors yet</p>
          {canWrite && <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Vendor</Button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{v.category}</span>
                <div className="flex gap-1">
                  {canWrite && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3 h-3" /></Button>}
                  {canWrite && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(v.id)}><Trash2 className="w-3 h-3" /></Button>}
                </div>
              </div>
              <h3 className="font-semibold">{v.name}</h3>
              <div className="flex items-center gap-1 mt-1 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= v.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />)}
              </div>
              <div className="space-y-1">
                {v.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{v.phone}</div>}
                {v.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{v.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <FindLocalVendorsPanel open={localOpen} onClose={() => setLocalOpen(false)} properties={properties} onSaved={load} />
      <FindSuppliesPanel open={suppliesOpen} onClose={() => setSuppliesOpen(false)} />

      <ModalWrapper open={open} onOpenChange={setOpen} title={editing ? "Edit Vendor" : "Add Vendor"}>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <FormGrid>
              <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-1234" /></div>
              <div><Label>Email</Label><Input type="email" className="mt-1" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="vendor@example.com" /></div>
            </FormGrid>
            <div><Label>Rating (1–5)</Label><Input type="number" min="1" max="5" className="mt-1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} /></div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="h-11 px-4">Cancel</Button>
            <Button onClick={save} className="h-11 px-4">Save</Button>
          </div>
      </ModalWrapper>
    </div>
  );
}
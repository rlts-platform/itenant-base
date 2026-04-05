import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Home, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalWrapper from "@/components/ModalWrapper";
import FormGrid from "@/components/FormGrid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ unit_number: "", bedrooms: 1, bathrooms: 1, sqft: "", rent_amount: "", deposit_amount: "", status: "vacant", pet_friendly: false, property_id: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [u, p] = await Promise.all([base44.entities.Unit.list(), base44.entities.Property.list()]);
    setUnits(u); setProperties(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ unit_number: "", bedrooms: 1, bathrooms: 1, sqft: "", rent_amount: "", deposit_amount: "", status: "vacant", pet_friendly: false, property_id: properties[0]?.id || "" }); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ unit_number: u.unit_number, bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft || "", rent_amount: u.rent_amount || "", deposit_amount: u.deposit_amount || "", status: u.status || "vacant", pet_friendly: !!u.pet_friendly, property_id: u.property_id || "" }); setOpen(true); };

  const save = async () => {
    const data = { ...form, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), sqft: Number(form.sqft), rent_amount: Number(form.rent_amount), deposit_amount: Number(form.deposit_amount) };
    if (editing) await base44.entities.Unit.update(editing.id, data);
    else await base44.entities.Unit.create(data);
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.Unit.delete(id); load(); };
  const propName = (id) => properties.find(p => p.id === id)?.nickname || properties.find(p => p.id === id)?.address || "—";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Units</h1><p className="text-sm text-muted-foreground mt-1">{units.length} units total</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Add Unit</Button>
      </div>

      {units.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No units yet</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Unit</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>
                {["Unit", "Property", "Bed/Bath", "Rent", "Deposit", "Status", "Pets", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium">{u.unit_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{propName(u.property_id)}</td>
                  <td className="px-4 py-3">{u.bedrooms}bd / {u.bathrooms}ba</td>
                  <td className="px-4 py-3 font-medium">${u.rent_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">${u.deposit_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={u.status === "occupied" ? "default" : "secondary"}>{u.status}</Badge></td>
                  <td className="px-4 py-3">{u.pet_friendly ? "✓" : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(u.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalWrapper open={open} onOpenChange={setOpen} title={editing ? "Edit Unit" : "Add Unit"}>
          <div className="space-y-4">
            <div><Label>Property</Label>
              <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <FormGrid>
              <div><Label>Unit Number</Label><Input className="mt-1" value={form.unit_number} onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} placeholder="A101" /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="vacant">Vacant</SelectItem><SelectItem value="occupied">Occupied</SelectItem></SelectContent>
                </Select>
              </div>
            </FormGrid>
            <FormGrid>
              <div><Label>Bedrooms</Label><Input type="number" className="mt-1" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} placeholder="2" /></div>
              <div><Label>Bathrooms</Label><Input type="number" className="mt-1" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} placeholder="1" /></div>
            </FormGrid>
            <FormGrid>
              <div><Label>Sq Ft</Label><Input type="number" className="mt-1" value={form.sqft} onChange={e => setForm(f => ({ ...f, sqft: e.target.value }))} placeholder="1200" /></div>
              <div><Label>Rent Amount</Label><Input type="number" className="mt-1" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))} placeholder="2500" /></div>
            </FormGrid>
            <div><Label>Deposit Amount</Label><Input type="number" className="mt-1" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))} placeholder="2500" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.pet_friendly} onCheckedChange={v => setForm(f => ({ ...f, pet_friendly: v }))} />
              <Label>Pet Friendly</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
          </ModalWrapper>
    </div>
  );
}
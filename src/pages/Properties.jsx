import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES = ["single_family", "multi_family", "condo", "apartment", "commercial"];

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ address: "", nickname: "", type: "single_family" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await base44.entities.Property.list("-created_date");
    setProperties(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ address: "", nickname: "", type: "single_family" }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ address: p.address, nickname: p.nickname || "", type: p.type || "single_family" }); setOpen(true); };

  const save = async () => {
    if (editing) {
      await base44.entities.Property.update(editing.id, form);
    } else {
      await base44.entities.Property.create(form);
    }
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    await base44.entities.Property.delete(id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-700">Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">{properties.length} properties total</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Add Property</Button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No properties yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first property to get started</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Add Property</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <h3 className="font-semibold truncate">{p.nickname || p.address}</h3>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="text-xs truncate">{p.address}</span>
              </div>
              <span className="mt-3 inline-block text-xs bg-secondary px-2 py-0.5 rounded-full">{p.type?.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Address</Label><Input className="mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>Nickname (optional)</Label><Input className="mt-1" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
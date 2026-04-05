import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Building2, MapPin, Pencil, Trash2, ChevronRight } from "lucide-react";
import PropertyProfile from "./PropertyProfile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const TYPES = ["single_family", "multi_family", "condo", "apartment", "commercial"];

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ address: "", nickname: "", type: "single_family" });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId) return <PropertyProfile propertyId={selectedId} onBack={() => setSelectedId(null)} />;

  const load = async () => {
    const data = await base44.entities.Property.list("-created_date");
    setProperties(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ address: "", nickname: "", type: "single_family" }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ address: p.address, nickname: p.nickname || "", type: p.type || "single_family" }); setOpen(true); };
  const save = async () => {
    if (editing) await base44.entities.Property.update(editing.id, form);
    else await base44.entities.Property.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { await base44.entities.Property.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-800 text-foreground">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your rental properties</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" />Add Property
        </Button>
      </motion.div>

      {properties.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-border rounded-2xl p-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No properties yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first property to get started</p>
          <Button onClick={openAdd} className="mt-4 gap-2 rounded-xl"><Plus className="w-4 h-4" />Add Property</Button>
        </motion.div>
      ) : (
        <motion.div className="space-y-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
          <AnimatePresence>
            {properties.map(p => (
              <motion.div
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                className="bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground leading-tight">{p.nickname || p.address}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm">{p.address}</span>
                    </div>
                    {p.type && <span className="mt-2 inline-block text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full capitalize">{p.type.replace(/_/g, " ")}</span>}
      <div className="flex gap-2 mt-3">
                      <button onClick={() => setSelectedId(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                        View Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => remove(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-destructive hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Address</Label><Input className="mt-1 rounded-xl" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>Nickname (optional)</Label><Input className="mt-1 rounded-xl" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="rounded-xl" onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
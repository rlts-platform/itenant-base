import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FolderOpen, Upload, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["lease","receipt","notice","inspection","other"];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ file_name: "", category: "other", tenant_id: "", property_id: "" });
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [d, t, p] = await Promise.all([base44.entities.Document.list("-created_date"), base44.entities.Tenant.list(), base44.entities.Property.list()]);
    setDocs(d); setTenants(t); setProperties(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setForm(f => ({ ...f, file_name: f.file_name || file.name }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const save = async () => {
    if (!fileUrl) return;
    await base44.entities.Document.create({ ...form, file_url: fileUrl });
    setOpen(false); setFileUrl(""); load();
  };
  const remove = async (id) => { await base44.entities.Document.delete(id); load(); };
  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : null; };
  const propName = (id) => properties.find(p => p.id === id)?.nickname || properties.find(p => p.id === id)?.address || null;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-outfit font-700">Documents</h1><p className="text-sm text-muted-foreground mt-1">{docs.length} documents</p></div>
        <Button onClick={() => { setForm({ file_name: "", category: "other", tenant_id: "", property_id: "" }); setFileUrl(""); setOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Upload</Button>
      </div>

      {docs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No documents yet</p>
          <Button onClick={() => setOpen(true)} className="mt-4 gap-2"><Upload className="w-4 h-4" />Upload Document</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(d => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{d.category}</Badge>
                <div className="flex gap-1">
                  <a href={d.file_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3 h-3" /></Button></a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(d.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <p className="font-medium text-sm truncate">{d.file_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{tenantName(d.tenant_id) || propName(d.property_id) || "General"}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-4 hover:bg-secondary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : fileUrl ? "File uploaded ✓" : "Click to upload"}</span>
                <input type="file" className="hidden" onChange={handleFile} />
              </label>
            </div>
            <div><Label>File Name</Label><Input className="mt-1" value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tenant (optional)</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!fileUrl || uploading}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
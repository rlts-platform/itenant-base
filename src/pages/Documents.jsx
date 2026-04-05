import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Upload, Trash2, ExternalLink, Sparkles, Loader2, PenLine, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import FolderTree, { SUBCATEGORY_LABELS, FOLDER_TREE } from "../components/documents/FolderTree";
import DeleteGuardDialog from "../components/documents/DeleteGuardDialog";
import DocGeneratorModal from "../components/documents/DocGeneratorModal";
import SignatureRequestModal from "../components/documents/SignatureRequestModal";

// Flat list of all subcategory options for the dropdown
const ALL_SUBCATEGORIES = FOLDER_TREE.flatMap(f =>
  f.children?.length ? f.children.map(c => ({ id: c.id, label: c.label })) : [{ id: f.id, label: f.label }]
);

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [open, setOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [deleteGuard, setDeleteGuard] = useState(null);
  const [form, setForm] = useState({ file_name: "", subcategory: "other", tenant_id: "", property_id: "" });
  const [uploading, setUploading] = useState(false);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [signDoc, setSignDoc] = useState(null);

  const load = async () => {
    const [d, t, p] = await Promise.all([
      base44.entities.Document.list("-created_date"),
      base44.entities.Tenant.list(),
      base44.entities.Property.list(),
    ]);
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

    // AI categorize
    setAiCategorizing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Given the filename "${file.name}", classify it into one of these document subcategories. Return ONLY the subcategory id, nothing else.\n\nOptions:\n${ALL_SUBCATEGORIES.map(s => `${s.id}: ${s.label}`).join("\n")}`,
    });
    const guessed = result?.trim().toLowerCase().replace(/[^a-z_]/g, "");
    const match = ALL_SUBCATEGORIES.find(s => s.id === guessed);
    if (match) setForm(f => ({ ...f, subcategory: match.id }));
    setAiCategorizing(false);
  };

  const save = async () => {
    if (!fileUrl) return;
    await base44.entities.Document.create({ ...form, file_url: fileUrl, category: "other" });
    setOpen(false); setFileUrl(""); load();
  };

  const requestDelete = (doc) => setDeleteGuard(doc);

  const confirmDelete = async () => {
    if (!deleteGuard) return;
    await base44.entities.Document.delete(deleteGuard.id);
    setDeleteGuard(null);
    load();
  };

  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : null; };
  const propName = (id) => properties.find(p => p.id === id)?.nickname || properties.find(p => p.id === id)?.address || null;

  const filteredDocs = selectedFolder
    ? docs.filter(d => {
        // if a parent folder is selected, match all children
        const parent = FOLDER_TREE.find(f => f.id === selectedFolder);
        if (parent && parent.children?.length > 0) {
          const childIds = new Set(parent.children.map(c => c.id));
          return childIds.has(d.subcategory) || d.subcategory === selectedFolder;
        }
        return d.subcategory === selectedFolder || (!d.subcategory && selectedFolder === "other");
      })
    : docs;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Folder Tree */}
      <div className="w-56 shrink-0 border-r border-border bg-card p-3 overflow-y-auto hidden md:block">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">Folders</p>
        <FolderTree selected={selectedFolder} onSelect={setSelectedFolder} docs={docs} />
      </div>

      {/* Right: Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-outfit font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedFolder ? (SUBCATEGORY_LABELS[selectedFolder] || selectedFolder) : "All Documents"} · {filteredDocs.length} files
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGenOpen(true)} className="gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Generate
            </Button>
            <Button onClick={() => { setForm({ file_name: "", subcategory: "other", tenant_id: "", property_id: "" }); setFileUrl(""); setOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Upload
            </Button>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <p className="font-semibold text-muted-foreground">No documents in this folder</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(d => {
              const folderLabel = SUBCATEGORY_LABELS[d.subcategory] || d.subcategory || "Other";
              return (
                <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{folderLabel}</Badge>
                      {d.signature_status && d.signature_status !== "none" && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: d.signature_status === "signed" ? "#F0FDF4" : d.signature_status === "declined" ? "#FEF2F2" : "#FEF9C3", color: d.signature_status === "signed" ? "#22C55E" : d.signature_status === "declined" ? "#EF4444" : "#F59E0B" }}>
                          {d.signature_status === "signed" ? "✓ Signed" : d.signature_status === "declined" ? "✗ Declined" : "⏳ Pending"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                        {(d.file_url || d.body_text) && (
                          <a
                          href={d.file_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          onClick={!d.file_url ? (e) => {
                            e.preventDefault();
                            const blob = new Blob([d.body_text], { type: "text/plain" });
                            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = d.file_name + ".txt"; a.click();
                          } : undefined}
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3 h-3" /></Button>
                        </a>
                      )}
                      {d.signature_status !== "signed" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Request e-signature" onClick={() => setSignDoc(d)}>
                          <PenLine className="w-3 h-3" style={{ color: '#7C6FCD' }} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => requestDelete(d)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-medium text-sm truncate">{d.file_name}</p>
                  <p className="text-xs text-muted-foreground">{tenantName(d.tenant_id) || propName(d.property_id) || "General"}</p>
                  {d.body_text && <p className="text-xs text-muted-foreground italic line-clamp-2">{d.body_text.substring(0, 100)}…</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-4 hover:bg-secondary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading…" : fileUrl ? "File uploaded ✓" : "Click to upload"}
                </span>
                <input type="file" className="hidden" onChange={handleFile} />
              </label>
            </div>
            {aiCategorizing && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="w-4 h-4 animate-spin" /> AI is detecting document type…
              </div>
            )}
            <div><Label>File Name</Label><Input className="mt-1" value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} /></div>
            <div>
              <Label className="flex items-center gap-1.5">
                Folder
                {aiCategorizing ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : fileUrl ? <span className="text-xs text-primary font-medium">(AI suggested)</span> : null}
              </Label>
              <Select value={form.subcategory} onValueChange={v => setForm(f => ({ ...f, subcategory: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ALL_SUBCATEGORIES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tenant (optional)</Label>
              <Select value={form.tenant_id} onValueChange={v => setForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Property (optional)</Label>
              <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!fileUrl || uploading || aiCategorizing}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Guard */}
      <DeleteGuardDialog doc={deleteGuard} onConfirm={confirmDelete} onCancel={() => setDeleteGuard(null)} />

      {signDoc && (
        <SignatureRequestModal
          doc={signDoc}
          tenants={tenants}
          onClose={() => setSignDoc(null)}
          onSaved={() => { setSignDoc(null); load(); }}
        />
      )}

      <DocGeneratorModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        tenants={tenants}
        properties={properties}
        onSaved={load}
      />
    </div>
  );
}
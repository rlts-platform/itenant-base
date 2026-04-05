import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Loader2, Trash2, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["lease","receipt","notice","inspection","other"];

export default function PropertyDocumentsTab({ propertyId, docs, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("other");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({
      file_name: file.name,
      file_url,
      category,
      property_id: propertyId,
      account_id: "",
    });
    setUploading(false);
    onRefresh();
  };

  const confirmDelete = async () => {
    await base44.entities.Document.delete(deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Category for upload</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium cursor-pointer hover:bg-primary/5 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload Document"}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {docs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground">No documents uploaded yet.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["File","Category","Date",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[240px]">{d.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{d.category || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(d)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.file_name}</strong>?
            Make sure you have exported or downloaded this file before deleting — this cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            {deleteTarget?.file_url && (
              <a href={deleteTarget.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Download First</Button>
              </a>
            )}
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
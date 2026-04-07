import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GeneratedDocumentsSection({ docs, stateFilter, onDeleted }) {
  const [search, setSearch] = useState("");

  const generated = docs.filter(d => d.ai_generated);

  const filtered = generated.filter(d => {
    const matchState = !stateFilter || d.state_tag === stateFilter;
    const matchSearch = !search ||
      d.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.state_tag?.toLowerCase().includes(search.toLowerCase());
    return matchState && matchSearch;
  });

  const handleDownload = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, "_blank");
    } else if (doc.body_text) {
      const blob = new Blob([doc.body_text], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = doc.file_name + ".txt";
      a.click();
    }
  };

  const handleDelete = async (doc) => {
    await base44.entities.Document.delete(doc.id);
    onDeleted();
  };

  if (generated.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-base" style={{ color: '#1A1A2E' }}>Generated Documents</h2>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search by name or state…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Document Name</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">State</th>
              <th className="text-left px-4 py-3 font-medium">Date Generated</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-muted-foreground">No generated documents match your filter</td>
              </tr>
            ) : (
              filtered.map(doc => (
                <tr key={doc.id} className="border-b border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{doc.file_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{doc.subcategory || "document"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {doc.state_tag ? (
                      <Badge className="text-xs bg-primary text-primary-foreground">{doc.state_tag}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {doc.created_date ? new Date(doc.created_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleDownload(doc)}>
                      <Download className="w-3 h-3" /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
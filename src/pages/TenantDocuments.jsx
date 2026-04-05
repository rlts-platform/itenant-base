import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FolderOpen, FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const FOLDER_MAP = {
  lease: "Leases",
  receipt: "Receipts",
  notice: "Notices",
  inspection: "Inspections",
  other: "Other",
};

const AUTO_FOLDER_KEY = (doc) => {
  if (doc.subcategory?.includes("lease")) return "Leases";
  if (["notice", "violation", "eviction"].some(w => doc.subcategory?.includes(w))) return "Notices";
  if (["receipt", "invoice"].some(w => doc.subcategory?.includes(w))) return "Receipts";
  return "Other";
};

export default function TenantDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function load() {
      const tenants = await base44.entities.Tenant.filter({ email: user?.email });
      const t = tenants[0];
      setTenant(t);
      if (t) {
        const allDocs = await base44.entities.Document.list("-created_date");
        const shared = allDocs.filter(d => d.shared_with?.includes(t.id));
        setDocs(shared);
        if (shared.length > 0) {
          await base44.entities.Tenant.update(t.id, {
            unviewed_docs: shared.filter(d => !d.viewed_by_tenants?.includes(t.id)).length
          });
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const folders = ["all", "Leases", "Notices", "Receipts", "Other"];
  const filtered = activeCategory === "all" ? docs : docs.filter(d => AUTO_FOLDER_KEY(d) === activeCategory);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-700">My Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Documents shared by your property manager</p>
      </div>

      {docs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {folders.map(f => (
            <button key={f} onClick={() => setActiveCategory(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === f ? "bg-primary text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {f === "all" ? "All Documents" : f}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">Documents shared by your landlord will appear here</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {AUTO_FOLDER_KEY(doc)} · Shared {new Date(doc.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.file_url && (
                          <>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg"><Download className="w-3.5 h-3.5" />Download</Button>
                            </a>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg" onClick={() => {
                              const a = document.createElement("a");
                              a.href = `mailto:${tenant?.email}?subject=Document: ${doc.file_name}&body=Please find the attached document.`;
                              a.click();
                            }}><Mail className="w-3.5 h-3.5" />Email to me</Button>
                          </>
                        )}
                      </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
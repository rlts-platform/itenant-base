import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderOpen, Download, Trash2, Eye, ChevronDown, ChevronRight, X, Loader2 } from "lucide-react";
import { useAccount } from "../../hooks/useAccount";

const FOLDERS = [
  "Financial Reports",
  "Tenant Reports",
  "Maintenance Reports",
  "Lease Reports",
  "Occupancy Reports",
  "Custom Reports",
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function downloadCSV(report) {
  let data;
  try { data = JSON.parse(report.report_data); } catch { data = null; }
  if (!data?.rows?.length) return;
  const headers = data.columns || Object.keys(data.rows[0]);
  const csv = [headers, ...data.rows.map(r => headers.map(h => r[h] ?? ""))].map(row =>
    row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${report.name}.csv`;
  a.click();
}

function ReportRow({ report, onDelete, onView }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.SavedReport.delete(report.id);
    onDelete(report.id);
    setDeleting(false);
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/20">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#1A1A2E' }}>{report.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{report.report_type}</p>
        <p className="text-xs text-muted-foreground">
          Generated {formatDate(report.generated_at)}
          {report.generated_by && <span> · by {report.generated_by}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => onView(report)}>
          <Eye className="w-3 h-3" /> View
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2" onClick={() => downloadCSV(report)}>
          <Download className="w-3 h-3" /> CSV
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 text-red-600 hover:text-red-700" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}

function FolderSection({ folder, reports, onDelete, onView }) {
  const [open, setOpen] = useState(true);
  if (reports.length === 0) return null;
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-muted-foreground" />}
        <span className="font-semibold text-sm flex-1 text-left" style={{ color: '#1A1A2E' }}>{folder}</span>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{reports.length}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && reports.map(r => (
        <ReportRow key={r.id} report={r} onDelete={onDelete} onView={onView} />
      ))}
    </div>
  );
}

export default function SavedReportsTab({ onViewReport }) {
  const { accountId } = useAccount();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!accountId) return;
    base44.entities.SavedReport.filter({ account_id: accountId }, "-generated_at").then(data => {
      setReports(data);
      setLoading(false);
    });
  }, [accountId]);

  const hasFilters = search || dateFrom || dateTo;

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && r.generated_at < dateFrom) return false;
      if (dateTo && r.generated_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [reports, search, dateFrom, dateTo]);

  const byFolder = useMemo(() => {
    const map = {};
    FOLDERS.forEach(f => { map[f] = []; });
    filtered.forEach(r => {
      const folder = r.folder || "Custom Reports";
      if (!map[folder]) map[folder] = [];
      map[folder].push(r);
    });
    return map;
  }, [filtered]);

  const handleDelete = (id) => setReports(prev => prev.filter(r => r.id !== id));
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs">Search</Label>
            <Input className="mt-1" placeholder="Filter by report name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="mt-1 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="mt-1 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" className="gap-1.5 mb-0.5" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Folders */}
      {FOLDERS.every(f => (byFolder[f] || []).length === 0) ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center text-muted-foreground">
          <Folder className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{hasFilters ? "No reports match your filters." : "No saved reports yet."}</p>
          <p className="text-sm mt-1">Reports are automatically saved when generated.</p>
        </div>
      ) : (
        FOLDERS.map(folder => (
          <FolderSection
            key={folder}
            folder={folder}
            reports={byFolder[folder] || []}
            onDelete={handleDelete}
            onView={onViewReport}
          />
        ))
      )}
    </div>
  );
}
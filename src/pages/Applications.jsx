import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ApplicationDetail from "./ApplicationDetail";

const STATUS_COLOR = { new: "outline", under_review: "secondary", approved: "default", denied: "destructive" };
const STATUS_LABEL = { new: "New", under_review: "Under Review", approved: "Approved", denied: "Denied" };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    const [a, p] = await Promise.all([
      base44.entities.RentalApplication.list("-created_date"),
      base44.entities.Property.list(),
    ]);
    setApps(a); setProperties(p); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selectedId) return <ApplicationDetail appId={selectedId} onBack={() => { setSelectedId(null); load(); }} />;

  const propName = (id) => { const p = properties.find(p => p.id === id); return p?.nickname || p?.address || "—"; };
  const ratioColor = (r) => !r ? "" : r >= 3 ? "text-emerald-600" : r >= 2.5 ? "text-amber-600" : "text-red-600";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">{apps.length} rental application{apps.length !== 1 ? "s" : ""}</p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No applications yet</p>
          <p className="text-sm text-muted-foreground mt-1">Share your property application link to start receiving applications.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>
                {["Applicant", "Property", "Submitted", "Income-to-Rent", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a, i) => (
                <tr
                  key={a.id}
                  className={`${i % 2 === 0 ? "bg-card" : "bg-secondary/20"} cursor-pointer hover:bg-secondary/40 transition-colors`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <td className="px-4 py-3 font-medium">{a.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{propName(a.property_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.created_date ? new Date(a.created_date).toLocaleDateString() : "—"}</td>
                  <td className={`px-4 py-3 font-semibold ${ratioColor(a.income_to_rent_ratio)}`}>
                    {a.income_to_rent_ratio ? `${a.income_to_rent_ratio}x` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLOR[a.status] || "secondary"}>{STATUS_LABEL[a.status] || a.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Link2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { name: "Zillow Rental Manager", url: "https://help.zillow.com/rental-manager" },
  { name: "Apartments.com", url: "https://www.apartments.com/help" },
  { name: "Buildium", url: "https://support.buildium.com" },
  { name: "AppFolio", url: "https://help.appfolio.com" },
  { name: "TurboTenant", url: "https://support.turbotenant.com" },
  { name: "Avail", url: "https://help.avail.co" },
  { name: "RentRedi", url: "https://help.rentredi.com" },
  { name: "Rentec Direct", url: "https://www.rentecdirect.com/help" },
];

export default function Step4Import({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const mode = data.import_mode || "manual";
  const setMode = (m) => onChange({ ...data, import_mode: m });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    setExtracting(true);
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          street: { type: "string" }, city: { type: "string" }, state: { type: "string" }, zip: { type: "string" },
          type: { type: "string" }, year_built: { type: "string" }, nickname: { type: "string" },
          units: { type: "array", items: { type: "object", properties: {
            unit_number: { type: "string" }, bedrooms: { type: "string" }, bathrooms: { type: "string" },
            sqft: { type: "string" }, rent_amount: { type: "string" }, deposit_amount: { type: "string" }, status: { type: "string" }
          }}}
        }
      }
    });
    setExtracting(false);
    if (result.status === "success" && result.output) {
      const out = Array.isArray(result.output) ? result.output[0] : result.output;
      setExtracted(out);
      onChange({ ...data, import_mode: "file", imported_data: out });
    }
  };

  const applyExtracted = () => {
    onChange({ ...data, _apply_imported: true });
  };

  const cardStyle = (active) => ({
    background: active ? "rgba(124,111,205,0.1)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(124,111,205,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Import Existing Data <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: 14 }}>(optional)</span></h2>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Already have property info somewhere else? Import it.</p>
      </div>

      {/* Card 1 — Upload */}
      <div style={cardStyle(mode === "file")} onClick={() => setMode("file")}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,111,205,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Upload size={18} color="#7C6FCD" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Upload a Document or Spreadsheet</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>PDF, Excel (.xlsx), CSV, Word (.docx)</p>
          </div>
        </div>
        {mode === "file" && (
          <div className="mt-3">
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.2)", cursor: "pointer", color: "#9CA3AF", fontSize: 13 }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : extracting ? "AI is reading your file…" : "Choose file to upload"}
              <input type="file" accept=".pdf,.xlsx,.csv,.docx" className="hidden" onChange={handleFile} disabled={uploading || extracting} />
            </label>
            {extracting && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: "#7C6FCD" }}>
                <Loader2 size={14} className="animate-spin" /> AI is extracting property data…
              </div>
            )}
            {extracted && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#22C55E" }}>✓ Data extracted successfully</p>
                <div className="text-xs space-y-1" style={{ color: "#9CA3AF" }}>
                  {extracted.street && <p>Address: {extracted.street}, {extracted.city}, {extracted.state} {extracted.zip}</p>}
                  {extracted.units?.length > 0 && <p>Units found: {extracted.units.length}</p>}
                </div>
                <button onClick={applyExtracted} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 999, background: "#22C55E", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Apply to Form
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2 — Platform Connections */}
      <div style={cardStyle(mode === "platform")} onClick={() => setMode("platform")}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,111,205,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={18} color="#7C6FCD" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Connect a Platform Account</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Export from your existing property management platform</p>
          </div>
        </div>
        {mode === "platform" && (
          <div className="mt-3 space-y-2">
            {PLATFORMS.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm text-white">{p.name}</span>
                <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#7C6FCD", textDecoration: "none", padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(124,111,205,0.4)", background: "transparent" }}
                  onClick={e => e.stopPropagation()}>
                  Export Guide →
                </a>
              </div>
            ))}
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Export a CSV or spreadsheet from your platform, then upload it using Card 1 above.</p>
          </div>
        )}
      </div>

      {/* Card 3 — Manual */}
      <div style={cardStyle(mode === "manual")} onClick={() => setMode("manual")}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={18} color="#22C55E" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Enter Manually</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Already filled in Steps 1–3 above. You're good to go.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
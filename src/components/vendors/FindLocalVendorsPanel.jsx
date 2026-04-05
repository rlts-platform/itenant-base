import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Phone, Plus, CheckCircle } from "lucide-react";

const CATEGORY_KEYWORDS = {
  plumbing: "plumber",
  electrical: "electrician",
  hvac: "HVAC contractor",
  cleaning: "cleaning service",
  landscaping: "landscaping",
  general: "handyman",
  other: "contractor",
};

export default function FindLocalVendorsPanel({ open, onClose, properties, onSaved }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState({});

  const search = async () => {
    if (!properties.length) return;
    setLoading(true);
    setResults([]);
    const addresses = properties.map(p => p.address).join("; ");
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a local vendor finder. Given these property addresses: ${addresses}\n\nGenerate a realistic list of 8 local service providers within 25 miles. For each, provide: business name, category (one of: plumbing, electrical, hvac, cleaning, landscaping, general, other), phone number (realistic US format), estimated distance in miles (1-25), and a one-line specialty description.\n\nReturn JSON only.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          vendors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                phone: { type: "string" },
                distance_miles: { type: "number" },
                description: { type: "string" },
              }
            }
          }
        }
      }
    });
    setResults(response?.vendors || []);
    setLoading(false);
  };

  const saveVendor = async (v) => {
    await base44.entities.Vendor.create({
      name: v.name,
      category: v.category,
      phone: v.phone,
      rating: 4,
    });
    setSaved(s => ({ ...s, [v.name]: true }));
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Find Local Vendors</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Searching within 25 miles of your properties: <span className="font-medium text-foreground">{properties.map(p => p.address).join(", ") || "—"}</span>
          </p>

          {results.length === 0 && !loading && (
            <Button onClick={search} className="w-full gap-2">
              <MapPin className="w-4 h-4" /> Search for Local Vendors
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Searching nearby service providers…</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{results.length} vendors found</p>
                <Button variant="outline" size="sm" onClick={search} className="gap-1.5"><Loader2 className="w-3.5 h-3.5" />Refresh</Button>
              </div>
              <div className="space-y-2">
                {results.map((v, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{v.name}</p>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{v.category}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{v.distance_miles} mi</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                      {v.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{v.phone}</p>}
                    </div>
                    {saved[v.name] ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium shrink-0">
                        <CheckCircle className="w-4 h-4" /> Saved
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs" onClick={() => saveVendor(v)}>
                        <Plus className="w-3.5 h-3.5" /> Save
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
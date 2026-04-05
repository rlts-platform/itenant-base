import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart, ExternalLink, Search } from "lucide-react";

export default function FindSuppliesPanel({ open, onClose, prefill = "" }) {
  const [query, setQuery] = useState(prefill);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `A property manager needs to purchase: "${query}"\n\nSuggest 3-5 specific product options. For each, provide: a product name (specific, with brand if applicable), a short 1-2 sentence description of why it's a good choice, and an Amazon search query string to find it.\n\nReturn JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                amazon_search: { type: "string" },
              }
            }
          }
        }
      }
    });
    setResults(response?.products || []);
    setLoading(false);
  };

  const openAmazon = (searchQuery) => {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
    window.open(url, "_blank");
  };

  const handleOpen = (isOpen) => {
    if (!isOpen) { setResults([]); setQuery(prefill); }
    onClose(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />Find Supplies</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Describe what you need</label>
            <Textarea
              rows={3}
              placeholder="e.g. replacement kitchen garbage disposal, under-sink model, quiet motor…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) search(); }}
            />
            <p className="text-xs text-muted-foreground mt-1">Be specific for better results</p>
          </div>

          <Button onClick={search} disabled={loading || !query.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Finding supplies…" : "Find Products"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{results.length} product suggestions</p>
              {results.map((p, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.description}</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full shrink-0">#{i + 1}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs w-full"
                    onClick={() => openAmazon(p.amazon_search)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Search on Amazon
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
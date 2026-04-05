import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// value shape: { mode: "all" | "property" | "specific", property_id?: string, tenant_ids?: string[] }
// tenants: [{id, first_name, last_name}], properties: [{id, nickname, address}]

export default function RecipientSelector({ value, onChange, tenants, properties }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const mode = value?.mode || "all";
  const selectedPropId = value?.property_id || "";
  const selectedIds = value?.tenant_ids || [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredTenants = tenants.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : id; };
  const propName = (id) => { const p = properties.find(p => p.id === id); return p?.nickname || p?.address || id; };

  const removeSpecific = (id) => onChange({ ...value, tenant_ids: selectedIds.filter(x => x !== id) });
  const toggleSpecific = (id) => {
    const already = selectedIds.includes(id);
    onChange({ ...value, mode: "specific", tenant_ids: already ? selectedIds.filter(x => x !== id) : [...selectedIds, id] });
  };

  // Badge summary for the trigger area
  const summary = () => {
    if (mode === "all") return "All Tenants";
    if (mode === "property") return selectedPropId ? `All at ${propName(selectedPropId)}` : "All at Property…";
    if (mode === "specific" && selectedIds.length > 0) return null; // show badges
    return "Select recipients…";
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[36px] flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-input rounded-md bg-transparent text-sm text-left hover:bg-secondary/30 transition-colors"
      >
        {mode === "specific" && selectedIds.length > 0 ? (
          <>
            {selectedIds.map(id => (
              <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                {tenantName(id)}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeSpecific(id); }} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </>
        ) : (
          <span className="text-muted-foreground flex-1">{summary()}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Mode options */}
          <div className="p-2 space-y-0.5 border-b border-border">
            <button
              type="button"
              onClick={() => { onChange({ mode: "all" }); setOpen(false); }}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", mode === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary/60")}
            >
              All Tenants
            </button>
            {properties.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange({ mode: "property", property_id: p.id }); setOpen(false); }}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", mode === "property" && selectedPropId === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary/60")}
              >
                All at {p.nickname || p.address}
              </button>
            ))}
          </div>

          {/* Specific search */}
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-1 mb-1 font-medium">Specific Tenants</p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search tenants…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {filteredTenants.map(t => {
                const selected = selectedIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleSpecific(t.id)}
                    className={cn("w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2", selected ? "bg-primary/10 text-primary" : "hover:bg-secondary/60")}
                  >
                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 text-xs", selected ? "bg-primary border-primary text-white" : "border-input")}>
                      {selected && "✓"}
                    </div>
                    {t.first_name} {t.last_name}
                  </button>
                );
              })}
              {filteredTenants.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No tenants found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
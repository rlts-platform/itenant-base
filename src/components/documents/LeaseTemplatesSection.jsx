import { US_STATES } from "@/lib/usStates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default function LeaseTemplatesSection({ stateFilter, onGenerate }) {
  const states = stateFilter
    ? US_STATES.filter(s => s.abbr === stateFilter)
    : US_STATES;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-base" style={{ color: '#1A1A2E' }}>
          Lease Agreements — All 50 States
        </h2>
        <span className="text-xs text-muted-foreground">({states.length} templates)</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {states.map(state => (
          <div
            key={state.abbr}
            className="bg-white border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Badge className="text-xs font-bold px-2 py-0.5 bg-primary text-primary-foreground shrink-0">
                {state.abbr}
              </Badge>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1A1A2E' }}>
                  {state.name} Residential Lease
                </p>
                <p className="text-xs text-muted-foreground">State-specific clauses</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              onClick={() => onGenerate(state)}
            >
              Generate
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROPERTY_TYPES = [
  "Single Family", "Multi-Unit Building", "Apartment", "Townhouse",
  "Condo", "Duplex", "Triplex", "Fourplex", "Commercial", "Mixed Use"
];

export default function Step1Basics({ data, onChange }) {
  const set = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Property Basics</h2>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Enter the core details about your property.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="text-white mb-1 block">Street Address *</Label>
          <Input placeholder="123 Main St" value={data.street || ""} onChange={e => set("street", e.target.value)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Label className="text-white mb-1 block">City *</Label>
            <Input placeholder="Chicago" value={data.city || ""} onChange={e => set("city", e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
          <div>
            <Label className="text-white mb-1 block">State *</Label>
            <Input placeholder="IL" maxLength={2} value={data.state || ""} onChange={e => set("state", e.target.value.toUpperCase())}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
          <div>
            <Label className="text-white mb-1 block">ZIP *</Label>
            <Input placeholder="60601" value={data.zip || ""} onChange={e => set("zip", e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-white mb-1 block">Property Type *</Label>
            <Select value={data.type || ""} onValueChange={v => set("type", v)}>
              <SelectTrigger style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white mb-1 block">Year Built <span style={{ color: "#9CA3AF" }}>(optional)</span></Label>
            <Input placeholder="1998" value={data.year_built || ""} onChange={e => set("year_built", e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-white mb-1 block">Neighborhood / Complex <span style={{ color: "#9CA3AF" }}>(optional)</span></Label>
            <Input placeholder="e.g. Kings Court" value={data.neighborhood || ""} onChange={e => set("neighborhood", e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
          <div>
            <Label className="text-white mb-1 block">Property Nickname <span style={{ color: "#9CA3AF" }}>(optional)</span></Label>
            <Input placeholder="e.g. The Oak St House" value={data.nickname || ""} onChange={e => set("nickname", e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
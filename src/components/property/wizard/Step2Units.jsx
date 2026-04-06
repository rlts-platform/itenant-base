import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";

const EMPTY_UNIT = { unit_number: "", floor: "", bedrooms: "", bathrooms: "", sqft: "", rent_amount: "", deposit_amount: "", pet_deposit: "", status: "vacant" };
const FIELD_STYLE = { background: "#FFFFFF", border: "1.5px solid #7C6FCD", borderRadius: 8, color: "#1A1A2E" };
const LABEL_STYLE = { color: "#1A1A2E", fontWeight: 600, fontSize: 13 };

function UnitForm({ unit, index, onChange, onRemove, showRemove }) {
  const set = (f, v) => onChange(index, { ...unit, [f]: v });
  const inp = (placeholder, field, type = "text") => (
    <Input type={type} placeholder={placeholder} value={unit[field] || ""} onChange={e => set(field, e.target.value)}
      style={FIELD_STYLE} />
  );
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Unit {index + 1}</span>
        {showRemove && <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>}
      </div>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Unit # / Name</Label>{inp("e.g. 1A", "unit_number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Floor (optional)</Label>{inp("e.g. 2", "floor")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Bedrooms</Label>{inp("2", "bedrooms", "number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Bathrooms</Label>{inp("1", "bathrooms", "number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Sq Ft</Label>{inp("850", "sqft", "number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Monthly Rent ($)</Label>{inp("1200", "rent_amount", "number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Security Deposit ($)</Label>{inp("1200", "deposit_amount", "number")}</div>
        <div><Label className="mb-1 block" style={LABEL_STYLE}>Pet Deposit ($, optional)</Label>{inp("250", "pet_deposit", "number")}</div>
        <div className="col-span-2">
          <Label className="mb-1 block" style={LABEL_STYLE}>Status</Label>
          <Select value={unit.status || "vacant"} onValueChange={v => set("status", v)}>
            <SelectTrigger style={FIELD_STYLE}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default function Step2Units({ data, onChange }) {
  const [applyToAll, setApplyToAll] = useState(false);
  const unitCount = parseInt(data.unit_count) || 1;

  const setCount = (val) => {
    const n = Math.max(1, parseInt(val) || 1);
    const units = Array.from({ length: n }, (_, i) => data.units?.[i] || { ...EMPTY_UNIT });
    onChange({ ...data, unit_count: n, units });
  };

  const updateUnit = (index, unit) => {
    if (applyToAll) {
      const units = (data.units || []).map(u => ({ ...u, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, sqft: unit.sqft, rent_amount: unit.rent_amount, deposit_amount: unit.deposit_amount, pet_deposit: unit.pet_deposit }));
      units[index] = unit;
      onChange({ ...data, units });
    } else {
      const units = [...(data.units || [])];
      units[index] = unit;
      onChange({ ...data, units });
    }
  };

  const removeUnit = (index) => {
    const units = (data.units || []).filter((_, i) => i !== index);
    onChange({ ...data, unit_count: units.length, units });
  };

  const addUnit = () => {
    const units = [...(data.units || []), { ...EMPTY_UNIT }];
    onChange({ ...data, unit_count: units.length, units });
  };

  const units = data.units || [{ ...EMPTY_UNIT }];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Units Setup</h2>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Define the unit(s) in this property.</p>
      </div>

      <div>
        <Label className="mb-1 block" style={LABEL_STYLE}>How many units does this property have?</Label>
        <Input type="number" min={1} value={data.unit_count || 1} onChange={e => setCount(e.target.value)}
          style={{ ...FIELD_STYLE, width: 120 }} />
      </div>

      {unitCount > 1 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(124,111,205,0.1)", border: "1px solid rgba(124,111,205,0.3)" }}>
          <input type="checkbox" id="applyAll" checked={applyToAll} onChange={e => setApplyToAll(e.target.checked)} className="rounded" />
          <label htmlFor="applyAll" className="text-sm text-white cursor-pointer">
            <Copy size={14} className="inline mr-1" style={{ color: "#7C6FCD" }} />
            All units are the same layout — fill one, apply to all
          </label>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {units.map((unit, i) => (
          <UnitForm key={i} unit={unit} index={i} onChange={updateUnit} onRemove={removeUnit} showRemove={units.length > 1} />
        ))}
      </div>

      <Button variant="outline" onClick={addUnit} className="gap-2 w-full" style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
        <Plus size={14} /> Add Unit
      </Button>
    </div>
  );
}
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const UTILITIES = ["Water", "Electric", "Gas", "Trash", "Internet"];
const FIELD_STYLE = { background: "#FFFFFF", border: "1.5px solid #7C6FCD", borderRadius: 8, color: "#1A1A2E" };
const LABEL_STYLE = { color: "#1A1A2E", fontWeight: 600, fontSize: 13 };

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#7C6FCD" }} />
      <span className="text-sm text-white">{label}</span>
    </label>
  );
}

export default function Step3Details({ data, onChange }) {
  const set = (f, v) => onChange({ ...data, [f]: v });
  const toggleUtility = (u) => {
    const curr = data.utilities_included || [];
    const next = curr.includes(u) ? curr.filter(x => x !== u) : [...curr, u];
    set("utilities_included", next);
  };
  const inp = (placeholder, field, type = "text") => (
    <Input type={type} placeholder={placeholder} value={data[field] || ""} onChange={e => set(field, e.target.value)}
      style={FIELD_STYLE} />
  );
  const sel = (field, options, placeholder) => (
    <Select value={data[field] || ""} onValueChange={v => set(field, v)}>
      <SelectTrigger style={FIELD_STYLE}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Property Details</h2>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Amenities, policies, and notes.</p>
      </div>

      {/* Parking */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <Label className="font-semibold mb-3 block" style={LABEL_STYLE}>Parking</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block" style={LABEL_STYLE}>Parking Type</Label>
            {sel("parking_type", [
              { value: "none", label: "None" }, { value: "street", label: "Street" },
              { value: "driveway", label: "Driveway" }, { value: "garage", label: "Garage" }, { value: "covered", label: "Covered" }
            ], "Select")}
          </div>
          <div>
            <Label className="mb-1 block" style={LABEL_STYLE}>Number of Spaces</Label>
            {inp("2", "parking_spaces", "number")}
          </div>
        </div>
      </div>

      {/* Laundry */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <Label className="font-semibold mb-3 block" style={LABEL_STYLE}>Laundry</Label>
        {sel("laundry", [
          { value: "in_unit", label: "In-Unit" }, { value: "shared", label: "Shared" }, { value: "none", label: "None" }
        ], "Select laundry type")}
      </div>

      {/* Utilities */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <Label className="font-semibold mb-3 block" style={LABEL_STYLE}>Utilities Included in Rent</Label>
        <div className="grid grid-cols-2 gap-2">
          {UTILITIES.map(u => (
            <Toggle key={u} label={u} checked={(data.utilities_included || []).includes(u)} onChange={() => toggleUtility(u)} />
          ))}
        </div>
      </div>

      {/* Pet Policy */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <Label className="font-semibold mb-3 block" style={LABEL_STYLE}>Pet Policy</Label>
        {sel("pet_policy", [
          { value: "not_allowed", label: "Not Allowed" }, { value: "allowed", label: "Allowed" }, { value: "case_by_case", label: "Case by Case" }
        ], "Select pet policy")}
        {data.pet_policy === "allowed" && (
          <div className="mt-3">
            <Label className="mb-1 block" style={LABEL_STYLE}>Pet Deposit ($)</Label>
            {inp("250", "pet_deposit", "number")}
          </div>
        )}
      </div>

      {/* HOA */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <Label className="font-semibold mb-3 block" style={LABEL_STYLE}>HOA</Label>
        <div className="flex gap-4 mb-3">
          {["yes", "no"].map(v => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="hoa" value={v} checked={(data.has_hoa || "no") === v} onChange={() => set("has_hoa", v)}
                style={{ accentColor: "#7C6FCD" }} />
              <span className="text-sm text-white capitalize">{v === "yes" ? "Yes" : "No"}</span>
            </label>
          ))}
        </div>
        {data.has_hoa === "yes" && (
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1 block" style={LABEL_STYLE}>HOA Name</Label>{inp("HOA name", "hoa_name")}</div>
            <div><Label className="mb-1 block" style={LABEL_STYLE}>Monthly Fee ($)</Label>{inp("150", "hoa_monthly_fee", "number")}</div>
            <div className="col-span-2"><Label className="mb-1 block" style={LABEL_STYLE}>Contact Info</Label>{inp("Email or phone", "hoa_contact")}</div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label className="mb-1 block" style={LABEL_STYLE}>Property Management Notes <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></Label>
        <Textarea placeholder="Internal notes about this property..." value={data.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
          style={FIELD_STYLE} />
      </div>
    </div>
  );
}
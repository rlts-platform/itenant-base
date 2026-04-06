import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Step1Basics from "./wizard/Step1Basics";
import Step2Units from "./wizard/Step2Units";
import Step3Details from "./wizard/Step3Details";
import Step4Import from "./wizard/Step4Import";
import Step5Review from "./wizard/Step5Review";

const STEPS = ["Property Basics", "Units Setup", "Property Details", "Import Data", "Review & Save"];

const EMPTY = {
  street: "", city: "", state: "", zip: "", type: "", year_built: "", nickname: "", neighborhood: "",
  unit_count: 1, units: [{ unit_number: "", floor: "", bedrooms: "", bathrooms: "", sqft: "", rent_amount: "", deposit_amount: "", pet_deposit: "", status: "vacant" }],
  parking_type: "", parking_spaces: "", laundry: "", utilities_included: [], pet_policy: "not_allowed", pet_deposit: "",
  has_hoa: "no", hoa_name: "", hoa_monthly_fee: "", hoa_contact: "", notes: "",
  import_mode: "manual", imported_data: null,
};

export default function AddPropertyWizard({ open, onClose, onSaved, accountId }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setStep(0);
    setData({ ...EMPTY });
    onClose();
  };

  const canNext = () => {
    if (step === 0) return data.street && data.city && data.state && data.zip && data.type;
    return true;
  };

  // If imported data was applied, merge into form fields
  const handleChange = (newData) => {
    if (newData._apply_imported && newData.imported_data) {
      const imp = newData.imported_data;
      setData(d => ({
        ...d, ...newData,
        street: imp.street || d.street,
        city: imp.city || d.city,
        state: imp.state || d.state,
        zip: imp.zip || d.zip,
        type: imp.type || d.type,
        year_built: imp.year_built || d.year_built,
        nickname: imp.nickname || d.nickname,
        units: imp.units?.length ? imp.units.map(u => ({
          unit_number: u.unit_number || "", floor: "", bedrooms: u.bedrooms || "",
          bathrooms: u.bathrooms || "", sqft: u.sqft || "", rent_amount: u.rent_amount || "",
          deposit_amount: u.deposit_amount || "", pet_deposit: "", status: u.status || "vacant",
        })) : d.units,
        unit_count: imp.units?.length || d.unit_count,
        _apply_imported: false,
      }));
    } else {
      setData(newData);
    }
  };

  const save = async () => {
    setSaving(true);
    const address = [data.street, data.city, data.state, data.zip].filter(Boolean).join(", ");
    const property = await base44.entities.Property.create({
      address,
      nickname: data.nickname || undefined,
      type: data.type?.toLowerCase().replace(/[\s-]/g, "_") || "single_family",
      year_built: data.year_built || undefined,
      state: data.state,
      hoa_name: data.has_hoa === "yes" ? data.hoa_name : undefined,
      hoa_monthly_fee: data.has_hoa === "yes" ? Number(data.hoa_monthly_fee) || undefined : undefined,
      hoa_contact: data.has_hoa === "yes" ? data.hoa_contact : undefined,
      account_id: accountId,
      notes: [
        data.neighborhood ? `Neighborhood: ${data.neighborhood}` : "",
        data.parking_type ? `Parking: ${data.parking_type}${data.parking_spaces ? ` (${data.parking_spaces} spaces)` : ""}` : "",
        data.laundry ? `Laundry: ${data.laundry}` : "",
        data.utilities_included?.length ? `Utilities included: ${data.utilities_included.join(", ")}` : "",
        data.pet_policy ? `Pet policy: ${data.pet_policy}` : "",
        data.notes || "",
      ].filter(Boolean).join("\n") || undefined,
    });

    // Create all units
    await Promise.all((data.units || []).map((u, i) =>
      base44.entities.Unit.create({
        property_id: property.id,
        unit_number: u.unit_number || String(i + 1),
        bedrooms: Number(u.bedrooms) || undefined,
        bathrooms: Number(u.bathrooms) || undefined,
        sqft: Number(u.sqft) || undefined,
        rent_amount: Number(u.rent_amount) || undefined,
        deposit_amount: Number(u.deposit_amount) || undefined,
        status: u.status || "vacant",
        account_id: accountId,
      })
    ));

    setSaving(false);
    handleClose();
    onSaved(property.id);
  };

  const stepProps = { data, onChange: handleChange };
  const stepContent = [
    <Step1Basics key={0} {...stepProps} />,
    <Step2Units key={1} {...stepProps} />,
    <Step3Details key={2} {...stepProps} />,
    <Step4Import key={3} {...stepProps} />,
    <Step5Review key={4} data={data} />,
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" style={{ background: "#FFFFFF", border: "1.5px solid #D1C8F5", borderRadius: 20 }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#1A1A2E' }}>Add Property</DialogTitle>
          {/* Progress */}
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div style={{
                  height: 4, borderRadius: 999, flex: 1,
                  background: i <= step ? "#7C6FCD" : "#E9E6FF",
                  transition: "background 0.2s",
                }} />
              </div>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-1">
          {stepContent[step]}
        </div>

        <div className="flex justify-between pt-4 border-t" style={{ borderColor: "#E9E6FF" }}>
          <Button variant="ghost" onClick={step === 0 ? handleClose : () => setStep(s => s - 1)}
            style={{ color: "#6B7280", borderRadius: 999 }}>
            <ChevronLeft size={16} className="mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none", opacity: canNext() ? 1 : 0.5 }}>
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving}
              style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none" }}>
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Property"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
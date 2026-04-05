import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Save, AlertTriangle } from "lucide-react";

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const UTILITIES = ["water","electric","gas","trash","internet"];

const DISCLAIMER = "⚠️ DISCLAIMER: This document was AI-generated for reference purposes only. It should be reviewed by a licensed attorney before use.\n\n";

const DEFAULT_FORM = {
  tenantMode: "existing",
  tenant_id: "",
  manualFirst: "", manualLast: "", manualEmail: "", manualPhone: "",
  property_id: "",
  unit_id: "",
  start_date: "",
  end_date: "",
  rent_amount: "",
  deposit_amount: "",
  late_fee: "",
  late_fee_grace: "5",
  pet_policy: "no",
  pet_deposit: "",
  utilities: [],
  additional_terms: "",
  state: "Florida",
};

export default function LeaseGenerator({ open, onClose, onSaved, renewData = null }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState("form"); // form | preview
  const isRenewal = !!renewData;

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Tenant.list(),
      base44.entities.Property.list(),
      base44.entities.Unit.list(),
    ]).then(([t, p, u]) => { setTenants(t); setProperties(p); setUnits(u); });

    if (renewData) {
      setForm(f => ({
        ...DEFAULT_FORM,
        tenantMode: "existing",
        tenant_id: renewData.tenant_id || "",
        unit_id: renewData.unit_id || "",
        start_date: renewData.start_date || "",
        end_date: renewData.end_date || "",
        rent_amount: renewData.rent_amount || "",
        deposit_amount: renewData.deposit_amount || "",
        state: renewData.state || "Florida",
      }));
      setStep("form");
      setPreview("");
    } else {
      setForm({ ...DEFAULT_FORM });
      setStep("form");
      setPreview("");
    }
  }, [open, renewData]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filteredUnits = form.property_id
    ? units.filter(u => u.property_id === form.property_id)
    : units;

  const handleUnitSelect = (uid) => {
    const u = units.find(x => x.id === uid);
    set("unit_id", uid);
    if (u?.rent_amount) set("rent_amount", String(u.rent_amount));
    if (u?.property_id && !form.property_id) set("property_id", u.property_id);
  };

  const toggleUtility = (u) => {
    setForm(f => ({
      ...f,
      utilities: f.utilities.includes(u) ? f.utilities.filter(x => x !== u) : [...f.utilities, u]
    }));
  };

  const getTenantLabel = () => {
    if (form.tenantMode === "manual") return `${form.manualFirst} ${form.manualLast}`;
    const t = tenants.find(x => x.id === form.tenant_id);
    return t ? `${t.first_name} ${t.last_name}` : "Unknown";
  };

  const getUnitLabel = () => {
    const u = units.find(x => x.id === form.unit_id);
    const p = properties.find(x => x.id === (u?.property_id || form.property_id));
    return [p?.nickname || p?.address, u ? `Unit ${u.unit_number}` : ""].filter(Boolean).join(" – ");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const tenantLabel = getTenantLabel();
    const unitLabel = getUnitLabel();

    const prompt = `Generate a complete, legally-structured residential lease agreement for the state of ${form.state}.

Tenant: ${tenantLabel}
Property/Unit: ${unitLabel}
Lease Start Date: ${form.start_date}
Lease End Date: ${form.end_date}
Monthly Rent: $${form.rent_amount}
Security Deposit: $${form.deposit_amount}
Late Fee: $${form.late_fee || "N/A"} after ${form.late_fee_grace} day grace period
Pet Policy: ${form.pet_policy === "yes" ? `Allowed with $${form.pet_deposit} pet deposit` : "No pets allowed"}
Utilities Included: ${form.utilities.length ? form.utilities.join(", ") : "None – tenant responsible for all utilities"}
Additional Terms: ${form.additional_terms || "None"}

Generate the full lease with all standard residential lease clauses appropriate for ${form.state}, including but not limited to: premises description, term, rent payment, security deposit, maintenance responsibilities, entry notice, subletting policy, termination conditions, and any state-specific required disclosures.
Format clearly with numbered sections. Do not include signature blocks — those will be added separately.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setPreview(DISCLAIMER + result);
    setGenerating(false);
    setStep("preview");
  };

  const handleSave = async () => {
    setSaving(true);
    let tenantId = form.tenant_id;

    // If manual entry, create tenant first
    if (form.tenantMode === "manual") {
      const newTenant = await base44.entities.Tenant.create({
        first_name: form.manualFirst,
        last_name: form.manualLast,
        email: form.manualEmail,
        phone: form.manualPhone,
        unit_id: form.unit_id,
        status: "pending",
        account_id: "",
      });
      tenantId = newTenant.id;
      // Send invite
      await base44.functions.invoke("sendTenantInvite", { tenant_id: tenantId });
    }

    // Save document record
    const docName = isRenewal
      ? `Lease Renewal – ${getTenantLabel()} – ${form.start_date}`
      : `Lease Agreement – ${getTenantLabel()} – ${form.start_date}`;

    await base44.entities.Document.create({
      file_name: docName,
      category: "lease",
      subcategory: isRenewal ? "Lease Renewals" : "Active Leases",
      body_text: preview,
      tenant_id: tenantId,
      property_id: form.property_id,
      account_id: "",
    });

    // Create or update Lease record
    const leaseData = {
      tenant_id: tenantId,
      unit_id: form.unit_id,
      start_date: form.start_date,
      end_date: form.end_date,
      rent_amount: Number(form.rent_amount),
      deposit_amount: Number(form.deposit_amount),
      status: "draft",
      account_id: "",
    };

    if (isRenewal && renewData?.id) {
      await base44.entities.Lease.create({ ...leaseData, status: "draft" });
    } else {
      await base44.entities.Lease.create(leaseData);
    }

    setSaving(false);
    onSaved?.();
    onClose();
  };

  const canGenerate = () => {
    if (form.tenantMode === "manual") {
      if (!form.manualFirst || !form.manualLast || !form.manualEmail) return false;
    } else {
      if (!form.tenant_id) return false;
    }
    return form.unit_id && form.start_date && form.end_date && form.rent_amount;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isRenewal ? "Renew Lease" : "AI Lease Generator"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {step === "form" && (
            <div className="space-y-5 py-2">
              {/* Tenant Selection */}
              {!isRenewal && (
                <div>
                  <Label className="mb-2 block font-semibold">Tenant</Label>
                  <div className="flex gap-2 mb-3">
                    {[["existing","Select Existing"],["manual","Add Manually"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => set("tenantMode", val)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.tenantMode === val ? "bg-primary text-white border-primary" : "border-border hover:bg-secondary"}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>

                  {form.tenantMode === "existing" && (
                    <Select value={form.tenant_id} onValueChange={v => set("tenant_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                      <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.email}</SelectItem>)}</SelectContent>
                    </Select>
                  )}

                  {form.tenantMode === "manual" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>First Name</Label><Input className="mt-1" value={form.manualFirst} onChange={e => set("manualFirst", e.target.value)} /></div>
                      <div><Label>Last Name</Label><Input className="mt-1" value={form.manualLast} onChange={e => set("manualLast", e.target.value)} /></div>
                      <div><Label>Email</Label><Input className="mt-1" type="email" value={form.manualEmail} onChange={e => set("manualEmail", e.target.value)} /></div>
                      <div><Label>Phone</Label><Input className="mt-1" value={form.manualPhone} onChange={e => set("manualPhone", e.target.value)} /></div>
                    </div>
                  )}
                </div>
              )}

              {isRenewal && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  Renewing lease for <strong>{tenants.find(t => t.id === form.tenant_id)?.first_name || "tenant"}</strong>. Adjust the dates and rent amount below.
                </div>
              )}

              {/* Property & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Property</Label>
                  <Select value={form.property_id} onValueChange={v => { set("property_id", v); set("unit_id", ""); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit_id} onValueChange={handleUnitSelect}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>{filteredUnits.map(u => <SelectItem key={u.id} value={u.id}>Unit {u.unit_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates & Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" className="mt-1" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" className="mt-1" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
                <div><Label>Monthly Rent ($)</Label><Input type="number" className="mt-1" value={form.rent_amount} onChange={e => set("rent_amount", e.target.value)} /></div>
                <div><Label>Security Deposit ($)</Label><Input type="number" className="mt-1" value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)} /></div>
              </div>

              {/* Only show these for new leases */}
              {!isRenewal && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Late Fee ($)</Label><Input type="number" className="mt-1" value={form.late_fee} onChange={e => set("late_fee", e.target.value)} /></div>
                    <div><Label>Grace Period (days)</Label><Input type="number" className="mt-1" value={form.late_fee_grace} onChange={e => set("late_fee_grace", e.target.value)} /></div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Pet Policy</Label>
                    <div className="flex gap-2 mb-2">
                      {[["no","No Pets"],["yes","Pets Allowed"]].map(([val, lbl]) => (
                        <button key={val} onClick={() => set("pet_policy", val)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.pet_policy === val ? "bg-primary text-white border-primary" : "border-border hover:bg-secondary"}`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {form.pet_policy === "yes" && (
                      <div><Label>Pet Deposit ($)</Label><Input type="number" className="mt-1" value={form.pet_deposit} onChange={e => set("pet_deposit", e.target.value)} /></div>
                    )}
                  </div>

                  <div>
                    <Label className="mb-2 block">Utilities Included</Label>
                    <div className="flex flex-wrap gap-2">
                      {UTILITIES.map(u => (
                        <button key={u} onClick={() => toggleUtility(u)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors ${form.utilities.includes(u) ? "bg-primary text-white border-primary" : "border-border hover:bg-secondary"}`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>State</Label>
                    <Select value={form.state} onValueChange={v => set("state", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Additional Terms</Label>
                    <Textarea className="mt-1" rows={3} placeholder="Any specific clauses or conditions..." value={form.additional_terms} onChange={e => set("additional_terms", e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Review and edit the generated lease below before saving.
              </div>
              <Textarea
                className="font-mono text-xs leading-relaxed min-h-[400px]"
                value={preview}
                onChange={e => setPreview(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <div>
            {step === "preview" && (
              <Button variant="outline" onClick={() => setStep("form")}>← Edit Form</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {step === "form" && (
              <Button onClick={handleGenerate} disabled={!canGenerate() || generating} className="gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating…" : "Generate Lease"}
              </Button>
            )}
            {step === "preview" && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Lease"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
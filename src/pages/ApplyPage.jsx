import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Plus, Trash2, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Field = ({ label, required, children }) => (
  <div>
    <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

const FileUpload = ({ label, value, onChange, multiple, accept = "image/*,application/pdf" }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    onChange(multiple ? [...(value || []), ...urls] : urls[0]);
    setUploading(false);
  };
  return (
    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors">
      <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground">
        {uploading ? "Uploading…" : multiple ? `${(value || []).length} file(s) uploaded — click to add more` : value ? "✓ Uploaded" : label}
      </span>
      <input type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleFile} />
    </label>
  );
};

const emptyVehicle = { year: "", make: "", model: "", plate: "" };
const emptyPet = { type: "", breed: "", weight: "", count: 1 };

export default function ApplyPage() {
  const propertyId = window.location.pathname.split("/apply/")[1]?.split("/")[0];
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: "", email: "", dob: "", current_address: "", time_at_current: "",
    previous_address: "", employer_name: "", job_title: "", employment_start: "",
    monthly_income: "", supervisor_name: "", supervisor_phone: "",
    pay_stub_urls: [], other_income: "",
    prev_landlord_name: "", prev_landlord_phone: "",
    ref1_name: "", ref1_phone: "", ref1_relationship: "",
    ref2_name: "", ref2_phone: "", ref2_relationship: "",
    gov_id_url: "", has_pets: false, pets: [], vehicles: [],
    consent: false, signature: "", signature_date: new Date().toISOString().split("T")[0],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const timeShort = ["< 6 months","6–12 months","1–2 years","2+ years"];

  useEffect(() => {
    if (!propertyId) return setLoading(false);
    Promise.all([
      base44.entities.Property.filter({ id: propertyId }),
      base44.entities.Unit.filter({ property_id: propertyId }),
    ]).then(([props, u]) => {
      setProperty(props[0] || null);
      setUnits(u);
      setLoading(false);
    });
  }, [propertyId]);

  const avgRent = units.length ? units.reduce((s, u) => s + (u.rent_amount || 0), 0) / units.length : 0;
  const ratio = avgRent > 0 && form.monthly_income ? (Number(form.monthly_income) / avgRent).toFixed(2) : null;

  const validate = () => {
    const e = {};
    if (!form.full_name) e.full_name = true;
    if (!form.email) e.email = true;
    if (!form.gov_id_url) e.gov_id_url = true;
    if (!form.consent) e.consent = true;
    if (!form.signature) e.signature = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await base44.entities.RentalApplication.create({
      ...form,
      property_id: propertyId,
      monthly_income: Number(form.monthly_income) || 0,
      other_income: Number(form.other_income) || 0,
      income_to_rent_ratio: ratio ? Number(ratio) : null,
      status: "new",
    });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (submitted) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-10 max-w-md text-center">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-outfit font-bold mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground">Thank you, {form.full_name}. We've received your application and will be in touch soon.</p>
      </div>
    </div>
  );

  const err = (k) => errors[k] ? "border-destructive ring-1 ring-destructive" : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-outfit font-bold text-lg leading-tight">iTenant — Rental Application</p>
            {property && <p className="text-sm text-muted-foreground">{property.address}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-8">

        {/* Personal Info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required><Input className={err("full_name")} value={form.full_name} onChange={e => set("full_name", e.target.value)} /></Field>
            <Field label="Email Address" required><Input type="email" className={err("email")} value={form.email} onChange={e => set("email", e.target.value)} /></Field>
            <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} /></Field>
          </div>
        </section>

        {/* Address History */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Address History</h2>
          <Field label="Current Address"><Input value={form.current_address} onChange={e => set("current_address", e.target.value)} /></Field>
          <Field label="Time at Current Address">
            <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.time_at_current} onChange={e => set("time_at_current", e.target.value)}>
              <option value="">Select…</option>
              {timeShort.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {(form.time_at_current === "< 6 months" || form.time_at_current === "6–12 months" || form.time_at_current === "1–2 years") && (
            <Field label="Previous Address (required if less than 2 years)"><Input value={form.previous_address} onChange={e => set("previous_address", e.target.value)} /></Field>
          )}
        </section>

        {/* Employment */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Employment & Income</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employer Name"><Input value={form.employer_name} onChange={e => set("employer_name", e.target.value)} /></Field>
            <Field label="Job Title"><Input value={form.job_title} onChange={e => set("job_title", e.target.value)} /></Field>
            <Field label="Start Date"><Input type="date" value={form.employment_start} onChange={e => set("employment_start", e.target.value)} /></Field>
            <Field label="Gross Monthly Income ($)">
              <Input type="number" value={form.monthly_income} onChange={e => set("monthly_income", e.target.value)} />
              {ratio && <p className="text-xs text-emerald-600 mt-1 font-medium">Income-to-rent ratio: {ratio}x {Number(ratio) >= 3 ? "✓ Qualifies" : "⚠ Below 3x"}</p>}
            </Field>
            <Field label="Supervisor Name"><Input value={form.supervisor_name} onChange={e => set("supervisor_name", e.target.value)} /></Field>
            <Field label="Supervisor Phone"><Input type="tel" value={form.supervisor_phone} onChange={e => set("supervisor_phone", e.target.value)} /></Field>
            <Field label="Other Monthly Income ($)"><Input type="number" value={form.other_income} onChange={e => set("other_income", e.target.value)} /></Field>
          </div>
          <Field label="Pay Stubs (up to 3 files)">
            {form.pay_stub_urls.length < 3 && (
              <FileUpload label="Upload pay stubs" value={form.pay_stub_urls} onChange={urls => set("pay_stub_urls", urls)} multiple accept="image/*,application/pdf" />
            )}
            {form.pay_stub_urls.map((u, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <a href={u} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">Stub {i + 1}</a>
                <button type="button" onClick={() => set("pay_stub_urls", form.pay_stub_urls.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </Field>
        </section>

        {/* Rental History */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Rental History</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Previous Landlord Name"><Input value={form.prev_landlord_name} onChange={e => set("prev_landlord_name", e.target.value)} /></Field>
            <Field label="Previous Landlord Phone"><Input type="tel" value={form.prev_landlord_phone} onChange={e => set("prev_landlord_phone", e.target.value)} /></Field>
          </div>
        </section>

        {/* References */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">References</h2>
          {[1, 2].map(n => (
            <div key={n} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={`Reference ${n} Name`}><Input value={form[`ref${n}_name`]} onChange={e => set(`ref${n}_name`, e.target.value)} /></Field>
              <Field label="Phone"><Input type="tel" value={form[`ref${n}_phone`]} onChange={e => set(`ref${n}_phone`, e.target.value)} /></Field>
              <Field label="Relationship"><Input value={form[`ref${n}_relationship`]} onChange={e => set(`ref${n}_relationship`, e.target.value)} /></Field>
            </div>
          ))}
        </section>

        {/* ID */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Identification</h2>
          <Field label="Government-Issued ID Photo" required>
            <FileUpload label="Upload ID photo (required)" value={form.gov_id_url} onChange={url => set("gov_id_url", url)} multiple={false} accept="image/*" />
            {errors.gov_id_url && <p className="text-xs text-destructive mt-1">Required</p>}
          </Field>
        </section>

        {/* Pets */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Pets</h2>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="hasPets" checked={form.has_pets} onChange={e => set("has_pets", e.target.checked)} className="w-4 h-4" />
            <label htmlFor="hasPets" className="text-sm">I have pet(s)</label>
          </div>
          {form.has_pets && (
            <div className="space-y-3">
              {form.pets.map((pet, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Input placeholder="Type" value={pet.type} onChange={e => { const p=[...form.pets]; p[i]={...p[i],type:e.target.value}; set("pets",p); }} />
                  <Input placeholder="Breed" value={pet.breed} onChange={e => { const p=[...form.pets]; p[i]={...p[i],breed:e.target.value}; set("pets",p); }} />
                  <Input placeholder="Weight (lbs)" type="number" value={pet.weight} onChange={e => { const p=[...form.pets]; p[i]={...p[i],weight:e.target.value}; set("pets",p); }} />
                  <Input placeholder="Count" type="number" value={pet.count} onChange={e => { const p=[...form.pets]; p[i]={...p[i],count:e.target.value}; set("pets",p); }} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set("pets", [...form.pets, {...emptyPet}])} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add Pet</Button>
            </div>
          )}
        </section>

        {/* Vehicles */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Vehicles (up to 2)</h2>
          {form.vehicles.map((v, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary/30 rounded-lg">
              <Input placeholder="Year" value={v.year} onChange={e => { const vs=[...form.vehicles]; vs[i]={...vs[i],year:e.target.value}; set("vehicles",vs); }} />
              <Input placeholder="Make" value={v.make} onChange={e => { const vs=[...form.vehicles]; vs[i]={...vs[i],make:e.target.value}; set("vehicles",vs); }} />
              <Input placeholder="Model" value={v.model} onChange={e => { const vs=[...form.vehicles]; vs[i]={...vs[i],model:e.target.value}; set("vehicles",vs); }} />
              <Input placeholder="Plate" value={v.plate} onChange={e => { const vs=[...form.vehicles]; vs[i]={...vs[i],plate:e.target.value}; set("vehicles",vs); }} />
            </div>
          ))}
          {form.vehicles.length < 2 && (
            <Button type="button" variant="outline" size="sm" onClick={() => set("vehicles", [...form.vehicles, {...emptyVehicle}])} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add Vehicle</Button>
          )}
        </section>

        {/* Consent & Signature */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Consent & Signature</h2>
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${errors.consent ? "border-destructive bg-red-50" : "border-border bg-secondary/20"}`}>
            <input type="checkbox" id="consent" checked={form.consent} onChange={e => set("consent", e.target.checked)} className="w-4 h-4 mt-0.5" />
            <label htmlFor="consent" className="text-sm leading-relaxed">I authorize a background and credit check and certify all information provided is true and accurate. I understand that providing false information may result in denial or termination of tenancy.</label>
          </div>
          {errors.consent && <p className="text-xs text-destructive">You must agree to continue</p>}
          <Field label="Digital Signature (type your full name)" required>
            <Input className={`font-script text-lg ${err("signature")}`} placeholder="Type your full legal name…" value={form.signature} onChange={e => set("signature", e.target.value)} />
            {errors.signature && <p className="text-xs text-destructive mt-1">Required</p>}
          </Field>
          <Field label="Date"><Input type="date" value={form.signature_date} onChange={e => set("signature_date", e.target.value)} /></Field>
        </section>

        <Button type="submit" disabled={submitting} className="w-full h-12 text-base gap-2">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {submitting ? "Submitting…" : "Submit Application"}
        </Button>
        <p className="text-xs text-center text-muted-foreground pb-6">Your information is encrypted and securely stored.</p>
      </form>
    </div>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
    {children}
  </div>
);

export default function PropertyOverviewTab({ property, onSaved }) {
  const [form, setForm] = useState({
    year_built: property.year_built || "",
    purchase_date: property.purchase_date || "",
    purchase_price: property.purchase_price || "",
    market_value: property.market_value || "",
    state: property.state || "",
    mortgage_lender: property.mortgage_lender || "",
    mortgage_balance: property.mortgage_balance || "",
    mortgage_rate: property.mortgage_rate || "",
    mortgage_payment: property.mortgage_payment || "",
    insurance_provider: property.insurance_provider || "",
    insurance_premium: property.insurance_premium || "",
    insurance_expiry: property.insurance_expiry || "",
    hoa_name: property.hoa_name || "",
    hoa_monthly_fee: property.hoa_monthly_fee || "",
    hoa_contact: property.hoa_contact || "",
    property_tax_annual: property.property_tax_annual || "",
    property_tax_due_date: property.property_tax_due_date || "",
    notes: property.notes || "",
  });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    const numeric = ["purchase_price","market_value","mortgage_balance","mortgage_rate","mortgage_payment","insurance_premium","hoa_monthly_fee","property_tax_annual"];
    const data = { ...form };
    numeric.forEach(k => { if (data[k] !== "") data[k] = Number(data[k]); });
    await base44.entities.Property.update(property.id, data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Field label="Address"><p className="text-sm font-medium">{property.address}</p></Field>
        <Field label="Type"><p className="text-sm font-medium capitalize">{property.type?.replace(/_/g," ")}</p></Field>
        <Field label="State"><Input value={form.state} onChange={e => set("state", e.target.value)} /></Field>
        <Field label="Year Built"><Input value={form.year_built} onChange={e => set("year_built", e.target.value)} /></Field>
        <Field label="Purchase Date"><Input type="date" value={form.purchase_date} onChange={e => set("purchase_date", e.target.value)} /></Field>
        <Field label="Purchase Price ($)"><Input type="number" value={form.purchase_price} onChange={e => set("purchase_price", e.target.value)} /></Field>
        <Field label="Current Market Value ($)"><Input type="number" value={form.market_value} onChange={e => set("market_value", e.target.value)} /></Field>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Mortgage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Lender"><Input value={form.mortgage_lender} onChange={e => set("mortgage_lender", e.target.value)} /></Field>
          <Field label="Balance ($)"><Input type="number" value={form.mortgage_balance} onChange={e => set("mortgage_balance", e.target.value)} /></Field>
          <Field label="Rate (%)"><Input type="number" value={form.mortgage_rate} onChange={e => set("mortgage_rate", e.target.value)} /></Field>
          <Field label="Monthly Payment ($)"><Input type="number" value={form.mortgage_payment} onChange={e => set("mortgage_payment", e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Insurance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Provider"><Input value={form.insurance_provider} onChange={e => set("insurance_provider", e.target.value)} /></Field>
          <Field label="Annual Premium ($)"><Input type="number" value={form.insurance_premium} onChange={e => set("insurance_premium", e.target.value)} /></Field>
          <Field label="Expiry Date"><Input type="date" value={form.insurance_expiry} onChange={e => set("insurance_expiry", e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">HOA</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="HOA Name"><Input value={form.hoa_name} onChange={e => set("hoa_name", e.target.value)} /></Field>
          <Field label="Monthly Fee ($)"><Input type="number" value={form.hoa_monthly_fee} onChange={e => set("hoa_monthly_fee", e.target.value)} /></Field>
          <Field label="Contact"><Input value={form.hoa_contact} onChange={e => set("hoa_contact", e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Property Tax</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Annual Amount ($)"><Input type="number" value={form.property_tax_annual} onChange={e => set("property_tax_annual", e.target.value)} /></Field>
          <Field label="Due Date"><Input value={form.property_tax_due_date} onChange={e => set("property_tax_due_date", e.target.value)} placeholder="e.g. March 31" /></Field>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Notes</h3>
        <Textarea rows={4} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this property..." />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} className="gap-2">
          <Save className="w-4 h-4" />{saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
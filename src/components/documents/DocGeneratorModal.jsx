import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, Loader2, Download } from "lucide-react";
import { US_STATES } from "@/lib/usStates";

const DOC_TYPES = [
  { id: "move_in_checklist",   label: "Move-In Inspection Checklist",       subcategory: "inspection",       fields: ["tenant","property","date"] },
  { id: "move_out_checklist",  label: "Move-Out Inspection Checklist",      subcategory: "inspection",       fields: ["tenant","property","date"] },
  { id: "lease_violation",     label: "Lease Violation Notice",             subcategory: "lease_violation",  fields: ["tenant","property","date","specifics"] },
  { id: "late_rent_notice",    label: "Late Rent Notice",                   subcategory: "rent_receipt",     fields: ["tenant","property","date","amount"] },
  { id: "non_renewal_notice",  label: "Lease Non-Renewal Notice",           subcategory: "expired_lease",    fields: ["tenant","property","date"] },
  { id: "month_to_month",      label: "Month-to-Month Conversion Notice",   subcategory: "lease_renewal",    fields: ["tenant","property","date","amount"] },
  { id: "rent_increase",       label: "Rent Increase Notice",               subcategory: "rent_receipt",     fields: ["tenant","property","date","amount"] },
  { id: "deposit_return",      label: "Security Deposit Return Letter",     subcategory: "financial",        fields: ["tenant","property","date","amount","specifics"] },
];

const DISCLAIMER = "\n\n---\nDISCLAIMER: This document was generated with the assistance of AI and is provided for informational purposes only. It does not constitute legal advice. Landlord-tenant laws vary by state and locality. Always consult a licensed attorney before serving legal notices or making decisions based on this document.";

export default function DocGeneratorModal({ open, onClose, tenants, properties, onSaved, initialState }) {
  const [docType, setDocType] = useState("");
  const [selectedState, setSelectedState] = useState(initialState?.abbr || "");
  const [fields, setFields] = useState({ tenant: "", property: "", date: new Date().toISOString().split("T")[0], amount: "", specifics: "" });
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = DOC_TYPES.find(d => d.id === docType);

  const generate = async () => {
    if (!selectedType) return;
    setGenerating(true);

    const tenantObj = tenants.find(t => t.id === fields.tenant);
    const propObj = properties.find(p => p.id === fields.property);

    const stateObj = US_STATES.find(s => s.abbr === selectedState);
    const prompt = `Generate a professional, legally appropriate "${selectedType.label}" document for a residential property management context.${
      stateObj ? `\n\nSTATE: ${stateObj.name} — Apply all legally required ${stateObj.name}-specific clauses, disclosures, and landlord-tenant law requirements for this state.` : ""
    }

Details:
- Tenant: ${tenantObj ? `${tenantObj.first_name} ${tenantObj.last_name}` : "N/A"}
- Property: ${propObj?.address || propObj?.nickname || "N/A"}
- Date: ${fields.date}
${fields.amount ? `- Amount: $${fields.amount}` : ""}
${fields.specifics ? `- Additional details: ${fields.specifics}` : ""}

Write the complete document with proper formatting, salutation, body, and signature lines. Use professional language. Include all standard clauses appropriate for this document type. Do NOT include any placeholders — use the provided information or reasonable defaults.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setPreview(result + DISCLAIMER);
    setGenerating(false);
  };

  const save = async () => {
    if (!preview || !selectedType) return;
    setSaving(true);
    const tenantObj = tenants.find(t => t.id === fields.tenant);
    const propObj = properties.find(p => p.id === fields.property);
    const stateObj = US_STATES.find(s => s.abbr === selectedState);
    const docName = `${selectedType.label}${stateObj ? ` (${stateObj.abbr})` : ""}${tenantObj ? ` - ${tenantObj.first_name} ${tenantObj.last_name}` : ""} ${fields.date}`;
    await base44.entities.Document.create({
      file_name: docName,
      category: "other",
      subcategory: selectedType.subcategory,
      body_text: preview,
      tenant_id: fields.tenant || undefined,
      property_id: fields.property || undefined,
      state_tag: selectedState || undefined,
      ai_generated: true,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const reset = () => { setDocType(""); setPreview(""); setSelectedState(""); setFields({ tenant: "", property: "", date: new Date().toISOString().split("T")[0], amount: "", specifics: "" }); };

  const downloadTxt = () => {
    if (!preview) return;
    const blob = new Blob([preview], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (selectedType?.label || "document") + ".txt";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Document Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={v => { setDocType(v); setPreview(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select document type…" /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>State (optional)</Label>
              <Select value={selectedState} onValueChange={v => setSelectedState(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All states</SelectItem>
                  {US_STATES.map(s => <SelectItem key={s.abbr} value={s.abbr}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedType && (
            <div className="grid grid-cols-2 gap-3">
              {selectedType.fields.includes("tenant") && (
                <div>
                  <Label>Tenant</Label>
                  <Select value={fields.tenant} onValueChange={v => setFields(f => ({ ...f, tenant: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {selectedType.fields.includes("property") && (
                <div>
                  <Label>Property</Label>
                  <Select value={fields.property} onValueChange={v => setFields(f => ({ ...f, property: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {selectedType.fields.includes("date") && (
                <div>
                  <Label>Document Date</Label>
                  <Input type="date" className="mt-1" value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} />
                </div>
              )}
              {selectedType.fields.includes("amount") && (
                <div>
                  <Label>Amount ($)</Label>
                  <Input type="number" placeholder="0.00" className="mt-1" value={fields.amount} onChange={e => setFields(f => ({ ...f, amount: e.target.value }))} />
                </div>
              )}
              {selectedType.fields.includes("specifics") && (
                <div className="col-span-2">
                  <Label>Additional Details</Label>
                  <Textarea rows={2} className="mt-1" placeholder="Describe the specific issue or details…" value={fields.specifics} onChange={e => setFields(f => ({ ...f, specifics: e.target.value }))} />
                </div>
              )}
            </div>
          )}

          {selectedType && !preview && (
            <Button onClick={generate} disabled={generating} className="gap-2 w-full">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate Document"}
            </Button>
          )}

          {preview && (
            <div className="space-y-2">
              <Label>Preview & Edit</Label>
              <Textarea
                className="mt-1 font-mono text-xs leading-relaxed"
                rows={20}
                value={preview}
                onChange={e => setPreview(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">You can edit the document above before saving.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          {preview && (
            <>
              <Button variant="outline" onClick={() => setPreview("")}>Regenerate</Button>
              <Button variant="outline" onClick={downloadTxt} className="gap-2">
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save to Library
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
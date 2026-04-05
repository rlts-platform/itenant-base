import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import RecipientSelector from "./RecipientSelector";
import { Loader2 } from "lucide-react";

const MERGE_TAGS = [
  { tag: "[Tenant First Name]", label: "First Name" },
  { tag: "[Property Address]",  label: "Property" },
  { tag: "[Unit Number]",       label: "Unit #" },
  { tag: "[Rent Amount]",       label: "Rent $" },
  { tag: "[Due Date]",          label: "Due Date" },
  { tag: "[Lease End Date]",    label: "Lease End" },
  { tag: "[Late Fee Amount]",   label: "Late Fee" },
  { tag: "[Work Order Issue]",  label: "WO Issue" },
];

export default function PresetConfigPanel({ preset, rule, tenants, properties, onSave, onClose }) {
  const [recipients, setRecipients] = useState(
    rule ? { mode: rule.recipient_mode || "all", property_id: rule.recipient_property_id, tenant_ids: rule.recipient_tenant_ids || [] }
         : { mode: "all" }
  );
  const [subject, setSubject] = useState(rule?.subject || preset?.defaultSubject || "");
  const [body, setBody] = useState(rule?.body || preset?.defaultBody || "");
  const [saving, setSaving] = useState(false);

  const insertTag = (tag) => setBody(b => b + tag);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ subject, body, recipients });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle>Configure: {preset?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Recipients */}
          <div>
            <Label className="mb-1.5 block">Recipients</Label>
            <RecipientSelector value={recipients} onChange={setRecipients} tenants={tenants} properties={properties} />
          </div>

          {/* Subject */}
          <div>
            <Label className="mb-1.5 block">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject…" />
          </div>

          {/* Message body */}
          <div>
            <Label className="mb-1.5 block">Message Body</Label>
            <Textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here…" className="font-mono text-sm" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MERGE_TAGS.map(t => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertTag(t.tag)}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Click a tag to insert it into the message.</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ShareDialog({ doc, tenants, open, onClose, onShared }) {
  const [selected, setSelected] = useState(new Set(doc?.shared_with || []));
  const [saving, setSaving] = useState(false);

  const toggle = (tenantId) => {
    const newSet = new Set(selected);
    if (newSet.has(tenantId)) newSet.delete(tenantId);
    else newSet.add(tenantId);
    setSelected(newSet);
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    await base44.entities.Document.update(doc.id, { shared_with: Array.from(selected) });
    setSaving(false);
    onClose();
    onShared();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Share "{doc?.file_name}"</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {tenants.map(t => (
            <label key={t.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-secondary rounded-lg transition-colors">
              <Checkbox
                checked={selected.has(t.id)}
                onCheckedChange={() => toggle(t.id)}
              />
              <span className="text-sm font-medium">{t.first_name} {t.last_name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
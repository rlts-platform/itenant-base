import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

const TIME_WINDOWS = [
  { id: "morning", label: "Morning (8am - 12pm)" },
  { id: "afternoon", label: "Afternoon (12pm - 5pm)" },
  { id: "evening", label: "Evening (5pm - 8pm)" },
  { id: "all_day", label: "All Day" },
];

export default function ScheduleRepairSection({ workOrder, vendors, properties, onUpdate, conflictWarning, onConflictContinue, onConflictChangeDate }) {
  const [form, setForm] = useState({
    scheduled_date: workOrder?.scheduled_date || "",
    time_window: workOrder?.time_window || "morning",
    assigned_vendor_id: workOrder?.assigned_vendor_id || "",
    entry_instructions: workOrder?.entry_instructions || "",
    notify_tenant: workOrder?.notify_tenant ?? true,
  });

  useEffect(() => {
    setForm({
      scheduled_date: workOrder?.scheduled_date || "",
      time_window: workOrder?.time_window || "morning",
      assigned_vendor_id: workOrder?.assigned_vendor_id || "",
      entry_instructions: workOrder?.entry_instructions || "",
      notify_tenant: workOrder?.notify_tenant ?? true,
    });
  }, [workOrder?.id]);

  const handleUpdate = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onUpdate(updated);
  };

  const propName = properties.find(p => p.id === workOrder?.property_id)?.nickname || properties.find(p => p.id === workOrder?.property_id)?.address || "Unknown Property";

  return (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
      <h3 className="font-semibold text-sm">Schedule Repair</h3>

      {conflictWarning && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-yellow-700 font-medium">Scheduling Conflict</p>
            <p className="text-yellow-600 text-xs mt-1">You already have a scheduled repair at {propName} during this time window. Are you sure you want to schedule another?</p>
            <div className="flex gap-2 mt-2">
              <button onClick={onConflictContinue} className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">Continue</button>
              <button onClick={onConflictChangeDate} className="px-2 py-1 bg-white border border-yellow-300 text-yellow-700 text-xs rounded hover:bg-yellow-50">Change Date</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Scheduled Date</Label>
          <Input type="date" className="mt-1" value={form.scheduled_date} onChange={e => handleUpdate("scheduled_date", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Time Window</Label>
          <Select value={form.time_window} onValueChange={v => handleUpdate("time_window", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{TIME_WINDOWS.map(w => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Assigned Vendor</Label>
        <Select value={form.assigned_vendor_id} onValueChange={v => handleUpdate("assigned_vendor_id", v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select vendor (optional)" /></SelectTrigger>
          <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Entry Instructions</Label>
        <Textarea placeholder="e.g., Key is under mat, Unit manager is available 9am-5pm" className="mt-1 text-xs" value={form.entry_instructions} onChange={e => handleUpdate("entry_instructions", e.target.value)} rows={2} />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Switch checked={form.notify_tenant} onCheckedChange={v => handleUpdate("notify_tenant", v)} />
        <Label className="text-xs cursor-pointer">Notify tenant of scheduled date & time</Label>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, AlertTriangle, Bell, Clipboard, Siren, Wrench, Calendar, DollarSign, FileText, Loader2 } from "lucide-react";

const BROADCAST_TYPES = [
  { id: "general_announcement", label: "General Announcement", icon: Bell, color: "text-blue-600" },
  { id: "inspection_notice", label: "Inspection Notice", icon: Clipboard, color: "text-orange-600" },
  { id: "emergency_alert", label: "Emergency Alert", icon: Siren, color: "text-red-600" },
  { id: "maintenance_notice", label: "Maintenance Notice", icon: Wrench, color: "text-yellow-600" },
  { id: "community_event", label: "Community Event", icon: Calendar, color: "text-green-600" },
  { id: "rent_reminder", label: "Rent Reminder", icon: DollarSign, color: "text-purple-600" },
  { id: "policy_update", label: "Policy Update", icon: FileText, color: "text-slate-600" },
];

const MERGE_TAGS = [
  { tag: "[Tenant First Name]", label: "Tenant First Name" },
  { tag: "[Property Address]", label: "Property Address" },
  { tag: "[Unit Number]", label: "Unit Number" },
  { tag: "[Date]", label: "Today's Date" },
  { tag: "[Time]", label: "Current Time" },
];

export default function BroadcastComposer({ open, onClose, tenants, properties, account, onSent }) {
  const [form, setForm] = useState({
    type: "general_announcement",
    subject: "",
    body: "",
    recipient_mode: "all_tenants",
    recipient_property_ids: [],
    recipient_tenant_ids: [],
    delivery_methods: ["in_app"],
    scheduled_at: "",
    send_now: true,
  });
  const [sending, setSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const isEmergency = form.type === "emergency_alert";
  const deliveryMethods = isEmergency ? ["in_app", "email", "sms"] : form.delivery_methods;
  const canSchedule = !isEmergency;

  const recipientList = () => {
    if (form.recipient_mode === "all_tenants") return tenants.filter(t => t.status === "active");
    if (form.recipient_mode === "property_specific") {
      return tenants.filter(t => t.status === "active" && form.recipient_property_ids.some(pid => {
        const unit = properties.flatMap(p => p.units || []).find(u => u.unit_number === t.unit_id);
        return unit?.property_id === pid;
      }));
    }
    return tenants.filter(t => form.recipient_tenant_ids.includes(t.id));
  };

  const insertTag = (tag) => {
    setForm(f => ({ ...f, body: f.body + " " + tag }));
  };

  const toggleDeliveryMethod = (method) => {
    if (isEmergency) return;
    setForm(f => ({
      ...f,
      delivery_methods: f.delivery_methods.includes(method)
        ? f.delivery_methods.filter(m => m !== method)
        : [...f.delivery_methods, method],
    }));
  };

  const send = async () => {
    if (!form.subject || !form.body) {
      alert("Subject and message are required");
      return;
    }
    setSending(true);
    const data = {
      type: form.type,
      subject: form.subject,
      body: form.body,
      recipient_mode: form.recipient_mode,
      recipient_property_ids: form.recipient_mode === "property_specific" ? form.recipient_property_ids : [],
      recipient_tenant_ids: form.recipient_mode === "individual" ? form.recipient_tenant_ids : [],
      delivery_methods: deliveryMethods,
      account_id: account?.id,
    };
    if (form.scheduled_at && !form.send_now) {
      data.scheduled_at = new Date(form.scheduled_at).toISOString();
    } else {
      data.sent_at = new Date().toISOString();
    }
    await base44.entities.Broadcast.create(data);
    setSending(false);
    onClose();
    onSent?.();
  };

  const typeConfig = BROADCAST_TYPES.find(t => t.id === form.type);
  const TypeIcon = typeConfig?.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New Broadcast</DialogTitle></DialogHeader>
        
        {isEmergency && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">Emergency alerts are sent immediately via all channels and cannot be scheduled.</p>
          </div>
        )}

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div><Label>Broadcast Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BROADCAST_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" /> {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div><Label>Recipients</Label>
            <Select value={form.recipient_mode} onValueChange={v => setForm(f => ({ ...f, recipient_mode: v, recipient_property_ids: [], recipient_tenant_ids: [] }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tenants">All Active Tenants</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.id} value={`property-${p.id}`}>
                    All Tenants at {p.nickname || p.address}
                  </SelectItem>
                ))}
                <SelectItem value="individual">Specific Tenants</SelectItem>
              </SelectContent>
            </Select>

            {form.recipient_mode.startsWith("property-") && (
              <div className="mt-2">
                <Label className="text-xs">Select Properties</Label>
                <div className="space-y-1 mt-1">
                  {properties.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.recipient_property_ids.includes(p.id)}
                        onCheckedChange={v => setForm(f => ({
                          ...f,
                          recipient_property_ids: v
                            ? [...f.recipient_property_ids, p.id]
                            : f.recipient_property_ids.filter(id => id !== p.id),
                        }))}
                      />
                      {p.nickname || p.address}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.recipient_mode === "individual" && (
              <div className="mt-2">
                <Label className="text-xs">Search & Select Tenants</Label>
                <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                  {tenants.filter(t => t.status === "active").map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.recipient_tenant_ids.includes(t.id)}
                        onCheckedChange={v => setForm(f => ({
                          ...f,
                          recipient_tenant_ids: v
                            ? [...f.recipient_tenant_ids, t.id]
                            : f.recipient_tenant_ids.filter(id => id !== t.id),
                        }))}
                      />
                      {t.first_name} {t.last_name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-1">
              {recipientList().slice(0, 3).map(t => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  {t.first_name} {t.last_name}
                </Badge>
              ))}
              {recipientList().length > 3 && <Badge variant="secondary" className="text-xs">+{recipientList().length - 3} more</Badge>}
            </div>
          </div>

          <div><Label>Subject</Label><Input className="mt-1" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Water Maintenance Scheduled" /></div>

          <div><Label>Message Body</Label>
            <Textarea className="mt-1 text-sm" rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your message here..." />
            <div className="mt-2 text-xs">
              <p className="font-semibold mb-1">Quick Insert:</p>
              <div className="flex gap-1 flex-wrap">
                {MERGE_TAGS.map(t => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => insertTag(t.tag)}
                    className="px-2 py-1 bg-secondary hover:bg-secondary/70 rounded text-xs font-medium transition-colors"
                  >
                    {t.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div><Label>Delivery Methods</Label>
            <div className="space-y-2 mt-2">
              {["in_app", "email", "sms"].map(method => (
                <label key={method} className="flex items-center gap-2">
                  <Checkbox
                    checked={deliveryMethods.includes(method)}
                    onCheckedChange={() => toggleDeliveryMethod(method)}
                    disabled={isEmergency || (method === "email" && !account?.resend_key) || (method === "sms" && !account?.twilio_sid)}
                  />
                  <span className="text-sm capitalize">
                    {method === "in_app" ? "In-App Notification" : method === "email" ? "Email" : "SMS"}
                    {(method === "email" && !account?.resend_key) || (method === "sms" && !account?.twilio_sid) ? " (not enabled)" : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {canSchedule && (
            <div>
              <Label className="flex items-center gap-2">
                <Checkbox checked={!form.send_now} onCheckedChange={v => setForm(f => ({ ...f, send_now: !v, scheduled_at: "" }))} />
                Schedule for Later
              </Label>
              {!form.send_now && (
                <Input type="datetime-local" className="mt-2" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={sending || !form.subject || !form.body || (form.recipient_mode === "individual" && form.recipient_tenant_ids.length === 0)}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {form.send_now ? "Send Now" : "Schedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
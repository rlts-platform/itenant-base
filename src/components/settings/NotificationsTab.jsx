import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";

const EVENTS = [
  { id: "new_payment",    label: "New Payment Received",   desc: "When a payment is logged or confirmed" },
  { id: "late_payment",   label: "Late Payment Alert",     desc: "When rent is overdue" },
  { id: "new_work_order", label: "New Work Order",         desc: "When a maintenance request is submitted" },
  { id: "lease_expiring", label: "Lease Expiring",         desc: "When a lease is 60, 30, or 14 days from expiry" },
  { id: "new_message",    label: "New Message",            desc: "When a tenant sends a message" },
  { id: "community_post", label: "New Community Post",     desc: "When a post is added to the community board" },
];

const DEFAULT_PREFS = {
  email_enabled: true,
  sms_enabled: false,
  events: Object.fromEntries(EVENTS.map(e => [e.id, { email: true, sms: false }])),
};

function parsePrefs(account) {
  try {
    return account?.notification_prefs ? JSON.parse(account.notification_prefs) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function NotificationsTab({ account, onSaved }) {
  const [prefs, setPrefs] = useState(parsePrefs(account));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setGlobal = (key, val) => setPrefs(p => ({ ...p, [key]: val }));
  const setEvent = (eventId, channel, val) =>
    setPrefs(p => ({ ...p, events: { ...p.events, [eventId]: { ...p.events[eventId], [channel]: val } } }));

  const save = async () => {
    setSaving(true);
    await base44.entities.Account.update(account.id, { notification_prefs: JSON.stringify(prefs) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  return (
    <div className="space-y-5">
      {/* Global toggles */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Global Channels</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email Notifications</p>
            <p className="text-xs text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch checked={prefs.email_enabled} onCheckedChange={v => setGlobal("email_enabled", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">SMS Notifications</p>
            <p className="text-xs text-muted-foreground">Get instant text alerts for rent payments, maintenance updates, and lease activity</p>
          </div>
          <Switch checked={prefs.sms_enabled} onCheckedChange={v => setGlobal("sms_enabled", v)} />
        </div>
      </div>

      {/* Per-event toggles */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Per-Event Settings</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Event</th>
              <th className="text-center px-4 py-3 font-medium">Email</th>
              <th className="text-center px-4 py-3 font-medium">SMS</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e, i) => {
              const ev = prefs.events?.[e.id] || { email: true, sms: false };
              return (
                <tr key={e.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.desc}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={prefs.email_enabled && ev.email}
                      disabled={!prefs.email_enabled}
                      onCheckedChange={v => setEvent(e.id, "email", v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={prefs.sms_enabled && ev.sms}
                      disabled={!prefs.sms_enabled}
                      onCheckedChange={v => setEvent(e.id, "sms", v)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}
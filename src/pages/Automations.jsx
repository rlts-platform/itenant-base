import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Zap, Settings, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import PresetConfigPanel from "../components/automations/PresetConfigPanel";
import CustomRuleBuilder from "../components/automations/CustomRuleBuilder";
import RecipientBadges from "../components/automations/RecipientBadges";

const PRESETS = [
  { id: "rent_reminder_3d",   name: "Rent Due Reminder — 3 days before",      trigger: "3 days before due date",      action: "SMS + Email → Tenant",   channels: ["email","sms"] },
  { id: "rent_reminder_day",  name: "Rent Due Reminder — Day of",              trigger: "On rent due date",             action: "SMS + Email → Tenant",   channels: ["email","sms"] },
  { id: "late_alert_1d",      name: "Late Rent Alert — 1 day after",          trigger: "1 day after due, not paid",    action: "Notify client",          channels: ["email"] },
  { id: "late_tenant_2d",     name: "Late Rent Reminder — 2 days after",      trigger: "2 days after due date",        action: "SMS + Email → Tenant",   channels: ["email","sms"] },
  { id: "late_fee",           name: "Late Fee Applied",                        trigger: "After grace period",           action: "Record fee + notify tenant", channels: ["email"] },
  { id: "lease_exp_60",       name: "Lease Expiring — 60 days out",           trigger: "60 days before lease end",     action: "Alert client + Email tenant", channels: ["email"] },
  { id: "lease_exp_30",       name: "Lease Expiring — 30 days out",           trigger: "30 days before lease end",     action: "Alert client + Email tenant", channels: ["email"] },
  { id: "lease_exp_14",       name: "Lease Expiring — 14 days out (Final)",   trigger: "14 days before lease end",     action: "Alert both parties",     channels: ["email","sms"] },
  { id: "move_in_checklist",  name: "Move-In Checklist",                      trigger: "On lease start date",          action: "Send checklist → Tenant", channels: ["email"] },
  { id: "move_out_notice",    name: "Move-Out Notice — 30 days before",       trigger: "30 days before lease end",     action: "Send instructions → Tenant", channels: ["email"] },
  { id: "new_work_order",     name: "New Work Order Received",                trigger: "Work order created",           action: "Notify client immediately", channels: ["email"] },
  { id: "wo_assigned",        name: "Work Order Assigned to Vendor",          trigger: "Work order status: assigned",  action: "Notify tenant of update", channels: ["email"] },
  { id: "wo_completed",       name: "Work Order Completed",                   trigger: "Work order status: closed",    action: "Notify tenant + client", channels: ["email"] },
  { id: "payment_received",   name: "Payment Received",                       trigger: "Payment confirmed",            action: "Send receipt → Tenant",  channels: ["email"] },
  { id: "tenant_birthday",    name: "Tenant Birthday",                        trigger: "On tenant DOB (if on file)",   action: "Send birthday greeting", channels: ["email"] },
  { id: "inspection_reminder",name: "Inspection Reminder",                    trigger: "6 months after move-in",       action: "Remind client",          channels: ["email"] },
];

export default function Automations() {
  const [rules, setRules] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [configuring, setConfiguring] = useState(null); // { preset, rule }
  const [customOpen, setCustomOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [r, t, p] = await Promise.all([
      base44.entities.AutomationRule.list(),
      base44.entities.Tenant.list(),
      base44.entities.Property.list(),
    ]);
    setRules(r); setTenants(t); setProperties(p); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Get saved rule for a preset (if any)
  const ruleForPreset = (presetId) => rules.find(r => r.preset_id === presetId);
  const customRules = rules.filter(r => !r.is_preset);

  const togglePreset = async (preset) => {
    const existing = ruleForPreset(preset.id);
    if (existing) {
      await base44.entities.AutomationRule.update(existing.id, { is_enabled: !existing.is_enabled });
    } else {
      await base44.entities.AutomationRule.create({
        name: preset.name, is_preset: true, preset_id: preset.id,
        is_enabled: true, channels: preset.channels, recipient_mode: "all", account_id: "default",
      });
    }
    load();
  };

  const savePresetConfig = async ({ subject, body, recipients }) => {
    const { preset } = configuring;
    const existing = ruleForPreset(preset.id);
    const data = {
      name: preset.name, is_preset: true, preset_id: preset.id, is_enabled: true,
      channels: preset.channels, subject, body,
      recipient_mode: recipients.mode,
      recipient_property_id: recipients.property_id || null,
      recipient_tenant_ids: recipients.tenant_ids || [],
      account_id: "default",
    };
    if (existing) await base44.entities.AutomationRule.update(existing.id, data);
    else await base44.entities.AutomationRule.create(data);
    load();
  };

  const saveCustomRule = async ({ name, trigger_type, condition_field, condition_value, action_type, subject, body, recipients }) => {
    await base44.entities.AutomationRule.create({
      name, is_preset: false, trigger_type, condition_field, condition_value,
      action_type, subject, body, channels: [action_type.includes("sms") ? "sms" : "email"],
      is_enabled: true,
      recipient_mode: recipients.mode,
      recipient_property_id: recipients.property_id || null,
      recipient_tenant_ids: recipients.tenant_ids || [],
      account_id: "default",
    });
    load();
  };

  const removeCustom = async (id) => { await base44.entities.AutomationRule.delete(id); load(); };
  const toggleCustom = async (rule) => { await base44.entities.AutomationRule.update(rule.id, { is_enabled: !rule.is_enabled }); load(); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-bold">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure presets and build custom rules</p>
        </div>
        <Button onClick={() => setCustomOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Custom Rule
        </Button>
      </div>

      {/* PRESETS */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Automation Presets</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset, i) => {
            const rule = ruleForPreset(preset.id);
            const enabled = !!rule?.is_enabled;
            return (
              <div key={preset.id} className={`bg-card border rounded-xl p-4 transition-all ${enabled ? "border-primary/30 shadow-sm" : "border-border"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${enabled ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <Switch checked={enabled} onCheckedChange={() => togglePreset(preset)} />
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                    onClick={() => setConfiguring({ preset, rule })}
                    title="Configure"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <p className="text-sm font-semibold leading-snug mb-1">{preset.name}</p>
                <p className="text-xs text-muted-foreground mb-0.5">⚡ {preset.trigger}</p>
                <p className="text-xs text-muted-foreground mb-2">→ {preset.action}</p>

                {/* Recipient badges */}
                <div className="mb-2">
                  {rule ? (
                    <RecipientBadges rule={rule} tenants={tenants} properties={properties} />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not configured — defaults to all tenants</span>
                  )}
                </div>

                {/* Channels */}
                <div className="flex gap-1 flex-wrap">
                  {preset.channels.map(c => <Badge key={c} variant="secondary" className="text-xs capitalize">{c}</Badge>)}
                  {rule?.last_run && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" /> {new Date(rule.last_run).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CUSTOM RULES */}
      {customRules.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Custom Rules</h2>
          <div className="space-y-3">
            {customRules.map(r => (
              <div key={r.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${r.is_enabled ? "border-primary/30" : "border-border"}`}>
                <div className={`p-2 rounded-lg shrink-0 ${r.is_enabled ? "bg-primary/10" : "bg-secondary"}`}>
                  <Zap className={`w-4 h-4 ${r.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.name}</p>
                  <div className="flex gap-2 mt-1 flex-wrap items-center">
                    {r.trigger_type && <span className="text-xs text-muted-foreground">{r.trigger_type.replace(/_/g," ")} · {r.action_type?.replace(/_/g," ")}</span>}
                    <RecipientBadges rule={r} tenants={tenants} properties={properties} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={!!r.is_enabled} onCheckedChange={() => toggleCustom(r)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCustom(r.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preset Config Panel */}
      {configuring && (
        <PresetConfigPanel
          preset={configuring.preset}
          rule={configuring.rule}
          tenants={tenants}
          properties={properties}
          onSave={savePresetConfig}
          onClose={() => setConfiguring(null)}
        />
      )}

      {/* Custom Rule Builder */}
      <CustomRuleBuilder
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        tenants={tenants}
        properties={properties}
        onSave={saveCustomRule}
      />
    </div>
  );
}
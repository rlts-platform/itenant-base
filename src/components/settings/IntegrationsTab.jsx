import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, Save, Loader2 } from "lucide-react";

const ComingSoon = () => (
  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Coming Soon</span>
);

const ConnectedBadge = () => (
  <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
    <CheckCircle className="w-3 h-3" /> Connected
  </span>
);

function IntegrationCard({ title, description, logo, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {logo}
      </div>
      {children}
    </div>
  );
}

export default function IntegrationsTab({ account, onSaved }) {
  const [twilio, setTwilio] = useState({
    sid: account?.twilio_sid || "",
    token: account?.twilio_token || "",
    phone: account?.twilio_phone || "",
  });
  const [resend, setResend] = useState({ key: account?.resend_key || "" });
  const [savingTwilio, setSavingTwilio] = useState(false);
  const [savingResend, setSavingResend] = useState(false);
  const [savedTwilio, setSavedTwilio] = useState(false);
  const [savedResend, setSavedResend] = useState(false);

  const saveTwilio = async () => {
    setSavingTwilio(true);
    await base44.entities.Account.update(account.id, {
      twilio_sid: twilio.sid,
      twilio_token: twilio.token,
      twilio_phone: twilio.phone,
    });
    setSavingTwilio(false);
    setSavedTwilio(true);
    setTimeout(() => setSavedTwilio(false), 2000);
    onSaved();
  };

  const saveResend = async () => {
    setSavingResend(true);
    await base44.entities.Account.update(account.id, { resend_key: resend.key });
    setSavingResend(false);
    setSavedResend(true);
    setTimeout(() => setSavedResend(false), 2000);
    onSaved();
  };

  const twilioConnected = !!(account?.twilio_sid && account?.twilio_token && account?.twilio_phone);
  const resendConnected = !!account?.resend_key;

  return (
    <div className="space-y-4">
      {/* Twilio */}
      <IntegrationCard
        title="Twilio — SMS"
        description="Send SMS notifications and reminders to tenants"
        logo={twilioConnected ? <ConnectedBadge /> : null}
      >
        <div className="space-y-3">
          <div>
            <Label>Account SID</Label>
            <Input className="mt-1 font-mono text-sm" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilio.sid} onChange={e => setTwilio(t => ({ ...t, sid: e.target.value }))} />
          </div>
          <div>
            <Label>Auth Token</Label>
            <Input className="mt-1 font-mono text-sm" type="password" placeholder="••••••••••••••••••••••••••••••••" value={twilio.token} onChange={e => setTwilio(t => ({ ...t, token: e.target.value }))} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input className="mt-1" placeholder="+15551234567" value={twilio.phone} onChange={e => setTwilio(t => ({ ...t, phone: e.target.value }))} />
          </div>
          <Button onClick={saveTwilio} disabled={savingTwilio} size="sm" className="gap-1.5">
            {savingTwilio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {savedTwilio ? "Saved!" : "Save Twilio"}
          </Button>
        </div>
      </IntegrationCard>

      {/* Resend */}
      <IntegrationCard
        title="Resend — Email"
        description="Send transactional emails via Resend"
        logo={resendConnected ? <ConnectedBadge /> : null}
      >
        <div className="space-y-3">
          <div>
            <Label>API Key</Label>
            <Input className="mt-1 font-mono text-sm" type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={resend.key} onChange={e => setResend({ key: e.target.value })} />
          </div>
          <Button onClick={saveResend} disabled={savingResend} size="sm" className="gap-1.5">
            {savingResend ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {savedResend ? "Saved!" : "Save Resend"}
          </Button>
        </div>
      </IntegrationCard>

      {/* QuickBooks */}
      <IntegrationCard
        title="QuickBooks"
        description="Sync payments and expenses with QuickBooks Online"
        logo={<ComingSoon />}
      >
        <Button variant="outline" size="sm" disabled className="gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Connect QuickBooks
        </Button>
      </IntegrationCard>

      {/* Google Calendar */}
      <IntegrationCard
        title="Google Calendar"
        description="Sync lease dates, renewals, and reminders to Google Calendar"
        logo={<ComingSoon />}
      >
        <Button variant="outline" size="sm" disabled className="gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Connect Google Calendar
        </Button>
      </IntegrationCard>
    </div>
  );
}
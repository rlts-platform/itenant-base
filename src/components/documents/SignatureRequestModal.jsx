import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Copy, CheckCircle2, Loader2 } from "lucide-react";

export default function SignatureRequestModal({ doc, tenants, onClose, onSaved }) {
  const [tenantId, setTenantId] = useState(doc?.tenant_id || "");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const selectedTenant = tenants.find(t => t.id === tenantId);

  const send = async () => {
    setSending(true);
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const signerEmail = selectedTenant?.email || customEmail;
    const signerName = selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : customName;

    await base44.entities.Document.update(doc.id, {
      signature_status: "pending",
      signature_token: token,
      signature_requested_at: new Date().toISOString(),
      signer_email: signerEmail,
      signer_name: signerName,
      tenant_id: tenantId || doc.tenant_id,
    });

    const signUrl = `${window.location.origin}/sign/${token}`;
    setLink(signUrl);

    // Send email if we have an address
    if (signerEmail) {
      await base44.integrations.Core.SendEmail({
        to: signerEmail,
        subject: `Signature required: ${doc.file_name}`,
        body: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:32px auto;background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(124,111,205,0.15);">
          <div style="margin-bottom:20px;">
            <span style="font-weight:800;font-size:18px;color:#1A1A2E;">iTenant</span>
          </div>
          <h2 style="color:#1A1A2E;font-size:20px;font-weight:700;margin:0 0 12px;">Document Ready for Your Signature</h2>
          <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0 0 20px;">Hi ${signerName || 'there'},<br><br>A document has been sent to you for e-signature: <strong style="color:#1A1A2E;">${doc.file_name}</strong></p>
          <a href="${signUrl}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:#7C6FCD;color:#fff;font-weight:700;font-size:14px;text-decoration:none;">Review & Sign Document</a>
          <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0;">Or copy this link: ${signUrl}</p>
        </div>`,
        from_name: "iTenant Documents",
      });
    }

    setSending(false);
    onSaved?.();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!doc} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send for E-Signature</DialogTitle>
        </DialogHeader>

        {!link ? (
          <div className="space-y-4">
            <div style={{ background: "#F4F3FF", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(124,111,205,0.15)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", margin: "0 0 2px" }}>{doc?.file_name}</p>
              <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Will be sent for electronic signature</p>
            </div>

            <div>
              <Label style={{ fontSize: 13 }}>Tenant (from your list)</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant…" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!tenantId && (
              <div style={{ paddingTop: 4 }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 10px" }}>Or enter signer details manually:</p>
                <div className="space-y-3">
                  <div>
                    <Label style={{ fontSize: 13 }}>Full Name</Label>
                    <Input className="mt-1" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 13 }}>Email</Label>
                    <Input className="mt-1" type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)} placeholder="tenant@email.com" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={send}
                disabled={sending || (!tenantId && !customEmail)}
                style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none" }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {sending ? "Sending…" : "Send Signature Request"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{ background: "#F0FDF4", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={18} color="#22C55E" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A2E", margin: "0 0 3px" }}>Signature request sent!</p>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                  {selectedTenant?.email || customEmail
                    ? `Email sent to ${selectedTenant?.email || customEmail}`
                    : "Share the link below with the signer."}
                </p>
              </div>
            </div>
            <div>
              <Label style={{ fontSize: 13 }}>Signature Link</Label>
              <div className="flex gap-2 mt-1">
                <Input value={link} readOnly style={{ fontSize: 12, color: "#6B7280" }} />
                <Button variant="outline" size="icon" onClick={copyLink} style={{ flexShrink: 0 }}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose} style={{ background: "#7C6FCD", color: "#fff", borderRadius: 999, border: "none" }}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
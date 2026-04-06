import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Send, Clock, CheckCircle, Mail, Phone, User, Loader2, ZoomIn, RefreshCw, AlertTriangle } from "lucide-react";
import LeaseGenerator from "../components/LeaseGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const statusColor = { active: "default", inactive: "secondary", pending: "outline" };
const paymentStatusColor = { confirmed: "bg-emerald-100 text-emerald-700", pending: "bg-yellow-100 text-yellow-700", failed: "bg-red-100 text-red-700" };
const orderStatusColor = { new: "outline", in_progress: "secondary", closed: "default" };

export default function TenantDetail({ tenantId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [infoForm, setInfoForm] = useState({});
  const [notes, setNotes] = useState("");
  const [proofPhoto, setProofPhoto] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const load = async () => {
    const [tenantArr, units, properties, leases, payments, orders, invites, docs] = await Promise.all([
      base44.entities.Tenant.filter({ id: tenantId }),
      base44.entities.Unit.list(),
      base44.entities.Property.list(),
      base44.entities.Lease.filter({ tenant_id: tenantId }),
      base44.entities.Payment.filter({ tenant_id: tenantId }),
      base44.entities.WorkOrder.filter({ tenant_id: tenantId }),
      base44.entities.TenantInvite.filter({ tenant_id: tenantId }),
      base44.entities.Document.filter({ tenant_id: tenantId }),
    ]);
    const tenant = tenantArr[0] || {};
    const unit = units.find(u => u.id === tenant.unit_id);
    const property = unit ? properties.find(p => p.id === unit.property_id) : null;
    const activeLease = leases.find(l => l.status === "active") || leases[0];
    const latestInvite = invites.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    setData({ tenant, unit, property, activeLease, payments: payments.sort((a,b) => new Date(b.date)-new Date(a.date)), orders: orders.sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)), latestInvite, docs });
    setInfoForm({
      first_name: tenant.first_name || "",
      last_name: tenant.last_name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      dob: tenant.dob || "",
      emergency_contact_name: tenant.emergency_contact_name || "",
      emergency_contact_phone: tenant.emergency_contact_phone || "",
    });
    setNotes(tenant.notes || "");
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenantId]);

  const saveInfo = async () => {
    setSavingInfo(true);
    await base44.entities.Tenant.update(tenantId, infoForm);
    setSavingInfo(false);
    load();
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.Tenant.update(tenantId, { notes });
    setSavingNotes(false);
  };

  const resendInvite = async () => {
    setSendingInvite(true);
    await base44.functions.invoke("sendTenantInvite", { tenant_id: tenantId });
    setSendingInvite(false);
    load();
  };

  const InviteBadge = ({ inv }) => {
    if (!inv) return <span className="text-sm text-muted-foreground">No invite sent</span>;
    if (inv.status === "accepted") return <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium"><CheckCircle className="w-4 h-4" />Active (Accepted)</span>;
    if (inv.status === "expired") return <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium"><Clock className="w-4 h-4" />Expired</span>;
    return <span className="flex items-center gap-1.5 text-sm text-yellow-700 font-medium"><Send className="w-4 h-4" />Invited (Pending)</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { tenant, unit, property, activeLease, payments, orders, latestInvite, docs } = data;
  const totalPaid = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg">
            {tenant.first_name?.[0]}{tenant.last_name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-outfit font-bold">{tenant.first_name} {tenant.last_name}</h1>
            <p className="text-sm text-muted-foreground">{tenant.email}</p>
          </div>
          <Badge variant={statusColor[tenant.status] || "secondary"} className="ml-auto">{tenant.status}</Badge>
        </div>
      </div>

      {/* 1. Personal Info */}
      <Section title="Personal Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <F label="First Name"><Input value={infoForm.first_name} onChange={e => setInfoForm(f=>({...f,first_name:e.target.value}))} /></F>
          <F label="Last Name"><Input value={infoForm.last_name} onChange={e => setInfoForm(f=>({...f,last_name:e.target.value}))} /></F>
          <F label="Date of Birth"><Input type="date" value={infoForm.dob} onChange={e => setInfoForm(f=>({...f,dob:e.target.value}))} /></F>
          <F label="Email"><Input type="email" value={infoForm.email} onChange={e => setInfoForm(f=>({...f,email:e.target.value}))} /></F>
          <F label="Phone"><Input value={infoForm.phone} onChange={e => setInfoForm(f=>({...f,phone:e.target.value}))} /></F>
          <div />
          <F label="Emergency Contact Name"><Input value={infoForm.emergency_contact_name} onChange={e => setInfoForm(f=>({...f,emergency_contact_name:e.target.value}))} /></F>
          <F label="Emergency Contact Phone"><Input value={infoForm.emergency_contact_phone} onChange={e => setInfoForm(f=>({...f,emergency_contact_phone:e.target.value}))} /></F>
        </div>
        <div className="flex justify-end mt-2">
          <Button onClick={saveInfo} disabled={savingInfo} className="gap-2">
            {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingInfo ? "Saving…" : "Save Info"}
          </Button>
        </div>
      </Section>

      {/* 2. Unit & Lease Summary */}
      <Section title="Current Unit & Lease">
        {(() => {
          if (!activeLease?.end_date) return null;
          const daysUntil = Math.ceil((new Date(activeLease.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysUntil > 60) return null;
          const isUrgent = daysUntil <= 30;
          return (
            <div className={`flex items-start gap-3 rounded-lg p-3 mb-1 ${isUrgent ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isUrgent ? "text-red-600" : "text-amber-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isUrgent ? "text-red-700" : "text-amber-700"}`}>
                  {daysUntil <= 0 ? "Lease has expired" : `Lease expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                </p>
                <p className={`text-xs mt-0.5 ${isUrgent ? "text-red-600" : "text-amber-600"}`}>Generate a renewal agreement to keep this tenant.</p>
              </div>
              <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowRenewModal(true)}>
                <RefreshCw className="w-3.5 h-3.5" />Renew Lease
              </Button>
            </div>
          );
        })()}
        {!unit && !activeLease ? (
          <p className="text-sm text-muted-foreground">No unit or lease assigned.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <StatBox label="Property" value={property?.nickname || property?.address || "—"} />
            <StatBox label="Unit" value={unit ? `Unit ${unit.unit_number}` : "—"} />
            <StatBox label="Lease Status" value={activeLease?.status || "—"} />
            <StatBox label="Lease Start" value={activeLease?.start_date || "—"} />
            <StatBox label="Lease End" value={activeLease?.end_date || "—"} />
            <StatBox label="Monthly Rent" value={activeLease?.rent_amount ? `$${activeLease.rent_amount.toLocaleString()}` : "—"} />
            <StatBox label="Security Deposit" value={activeLease?.deposit_amount ? `$${activeLease.deposit_amount.toLocaleString()}` : "—"} />
          </div>
        )}
      </Section>

      {/* 3. Payment History */}
      <Section title={`Payment History — Total Paid: $${totalPaid.toLocaleString()}`}>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-xs">
                <tr>{["Date","Amount","Method","Status","Proof"].map(h=><th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className={i%2===0?"bg-card":"bg-secondary/20"}>
                    <td className="px-3 py-2 whitespace-nowrap">{p.date}</td>
                    <td className="px-3 py-2 font-medium">${p.amount?.toLocaleString()}</td>
                    <td className="px-3 py-2 capitalize">{p.method?.replace("_"," ")}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColor[p.status]||"bg-secondary text-secondary-foreground"}`}>{p.status}</span></td>
                    <td className="px-3 py-2">
                      {p.proof_image_url ? (
                        <button onClick={() => setProofPhoto(p.proof_image_url)}>
                          <img src={p.proof_image_url} alt="proof" className="w-8 h-8 rounded object-cover border border-border hover:opacity-80 transition-opacity" />
                        </button>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 4. Work Order History */}
      <Section title="Work Order History">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No work orders on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-xs">
                <tr>{["Date","Issue","Category","Status"].map(h=><th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className={i%2===0?"bg-card":"bg-secondary/20"}>
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(o.created_date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{o.summary}</td>
                    <td className="px-3 py-2 capitalize">{o.category}</td>
                    <td className="px-3 py-2"><Badge variant={orderStatusColor[o.status]||"secondary"}>{o.status?.replace("_"," ")}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 5. Documents */}
      <Section title="Documents">
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents shared with this tenant.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{d.file_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{d.category}{d.subcategory ? ` · ${d.subcategory}` : ""}</p>
                </div>
                {d.file_url && (
                  <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Download</Button>
                  </a>
                )}
                {d.body_text && !d.file_url && (
                  <Button variant="outline" size="sm" onClick={() => {
                    const blob = new Blob([d.body_text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = d.file_name + ".txt"; a.click();
                  }}>Download</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 6. Invite Status */}
      <Section title="Portal Invite">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <InviteBadge inv={latestInvite} />
          {latestInvite?.status !== "accepted" && (
            <Button variant="outline" onClick={resendInvite} disabled={sendingInvite} className="gap-2">
              {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendingInvite ? "Sending…" : latestInvite ? "Resend Invite" : "Send Invite"}
            </Button>
          )}
        </div>
        {latestInvite && (
          <p className="text-xs text-muted-foreground mt-2">
            Last sent: {new Date(latestInvite.created_date).toLocaleDateString()} · Expires: {latestInvite.expires_at ? new Date(latestInvite.expires_at).toLocaleDateString() : "—"}
          </p>
        )}
      </Section>

      {/* 7. Notes */}
      <Section title="Internal Notes">
        <p className="text-xs text-muted-foreground mb-2">Visible only to you and your team.</p>
        <Textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this tenant..." />
        <div className="flex justify-end mt-2">
          <Button onClick={saveNotes} disabled={savingNotes} className="gap-2">
            {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingNotes ? "Saving…" : "Save Notes"}
          </Button>
        </div>
      </Section>

      {/* Lease Renewal Generator */}
      <LeaseGenerator
        open={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onSaved={() => { setShowRenewModal(false); load(); }}
        renewData={activeLease ? {
          id: activeLease.id,
          tenant_id: activeLease.tenant_id,
          unit_id: activeLease.unit_id,
          start_date: activeLease.end_date, // renewal starts when old one ends
          end_date: "",
          rent_amount: activeLease.rent_amount,
          deposit_amount: activeLease.deposit_amount,
        } : null}
      />

      {/* Proof photo lightbox */}
      <Dialog open={!!proofPhoto} onOpenChange={() => setProofPhoto(null)}>
        <DialogContent className="max-w-2xl flex items-center justify-center">
          {proofPhoto && <img src={proofPhoto} alt="Payment proof" className="max-h-[70vh] rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
    <h2 className="font-semibold text-base">{title}</h2>
    {children}
  </div>
);

const F = ({ label, children }) => (
  <div><Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>{children}</div>
);

const StatBox = ({ label, value }) => (
  <div className="bg-secondary/30 rounded-lg p-3">
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);
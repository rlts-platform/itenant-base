import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle, XCircle, Loader2, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Section = ({ title, children }) => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);
const Row = ({ label, value }) => value ? (
  <div className="flex gap-4 text-sm">
    <span className="text-muted-foreground w-40 shrink-0">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
) : null;

const STATUS_COLOR = { new: "outline", under_review: "secondary", approved: "default", denied: "destructive" };
const STATUS_LABEL = { new: "New", under_review: "Under Review", approved: "Approved", denied: "Denied" };

export default function ApplicationDetail({ appId, onBack }) {
  const [app, setApp] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    const apps = await base44.entities.RentalApplication.filter({ id: appId });
    const a = apps[0];
    setApp(a);
    if (a?.property_id) {
      const props = await base44.entities.Property.filter({ id: a.property_id });
      setProperty(props[0] || null);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [appId]);

  const updateStatus = async (status) => {
    await base44.entities.RentalApplication.update(appId, { status });
    setApp(a => ({ ...a, status }));
  };

  const approve = async () => {
    setActing(true);
    await updateStatus("approved");
    // Create tenant record pre-filled
    await base44.entities.Tenant.create({
      first_name: app.full_name.split(" ")[0],
      last_name: app.full_name.split(" ").slice(1).join(" ") || "",
      email: app.email || "",
      status: "pending",
    });
    setActing(false);
    alert(`✓ Tenant record created for ${app.full_name}. Go to Tenants → then create a Lease for them.`);
  };

  const deny = async () => {
    setActing(true);
    await updateStatus("denied");
    if (app.email) {
      await base44.integrations.Core.SendEmail({
        to: app.email,
        subject: "Your Rental Application Status",
        body: `Dear ${app.full_name},\n\nThank you for your interest in renting at ${property?.address || "our property"}. After careful consideration, we regret to inform you that we are unable to move forward with your application at this time.\n\nWe appreciate the time you took to apply and wish you the best in your housing search.\n\nSincerely,\nThe Property Management Team`,
      });
    }
    setActing(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!app) return null;

  const ratioColor = !app.income_to_rent_ratio ? "" : app.income_to_rent_ratio >= 3 ? "text-emerald-600" : app.income_to_rent_ratio >= 2.5 ? "text-amber-600" : "text-red-600";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-outfit font-bold">{app.full_name}</h1>
          <p className="text-sm text-muted-foreground">{property?.address || "—"} · {app.created_date ? new Date(app.created_date).toLocaleDateString() : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={app.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Badge variant={STATUS_COLOR[app.status]}>{STATUS_LABEL[app.status]}</Badge>
        </div>
      </div>

      {/* Income-to-rent hero */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Income-to-Rent Ratio</p>
          <p className={`text-4xl font-outfit font-bold ${ratioColor}`}>{app.income_to_rent_ratio ? `${app.income_to_rent_ratio}x` : "N/A"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly income: ${Number(app.monthly_income || 0).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {app.status !== "approved" && app.status !== "denied" && (
            <>
              <Button onClick={deny} disabled={acting} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-red-50">
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Deny
              </Button>
              <Button onClick={approve} disabled={acting} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve & Create Tenant
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Personal">
          <Row label="Full Name" value={app.full_name} />
          <Row label="Email" value={app.email} />
          <Row label="Date of Birth" value={app.dob} />
          <Row label="Current Address" value={app.current_address} />
          <Row label="Time at Address" value={app.time_at_current} />
          {app.previous_address && <Row label="Previous Address" value={app.previous_address} />}
        </Section>

        <Section title="Employment">
          <Row label="Employer" value={app.employer_name} />
          <Row label="Job Title" value={app.job_title} />
          <Row label="Start Date" value={app.employment_start} />
          <Row label="Monthly Income" value={app.monthly_income ? `$${Number(app.monthly_income).toLocaleString()}` : null} />
          <Row label="Other Income" value={app.other_income ? `$${Number(app.other_income).toLocaleString()}` : null} />
          <Row label="Supervisor" value={app.supervisor_name} />
          <Row label="Supervisor Phone" value={app.supervisor_phone} />
          {app.pay_stub_urls?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {app.pay_stub_urls.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Pay Stub {i+1}</a>)}
            </div>
          )}
        </Section>

        <Section title="Rental History">
          <Row label="Previous Landlord" value={app.prev_landlord_name} />
          <Row label="Landlord Phone" value={app.prev_landlord_phone} />
        </Section>

        <Section title="References">
          <Row label="Reference 1" value={app.ref1_name} />
          <Row label="Phone" value={app.ref1_phone} />
          <Row label="Relationship" value={app.ref1_relationship} />
          <Row label="Reference 2" value={app.ref2_name} />
          <Row label="Phone" value={app.ref2_phone} />
          <Row label="Relationship" value={app.ref2_relationship} />
        </Section>

        {app.gov_id_url && (
          <Section title="Identification">
            <a href={app.gov_id_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" />View Government ID</a>
          </Section>
        )}

        {app.has_pets && app.pets?.length > 0 && (
          <Section title="Pets">
            {app.pets.map((p, i) => <Row key={i} label={`Pet ${i+1}`} value={`${p.type} · ${p.breed} · ${p.weight}lbs · ×${p.count}`} />)}
          </Section>
        )}

        {app.vehicles?.length > 0 && (
          <Section title="Vehicles">
            {app.vehicles.map((v, i) => <Row key={i} label={`Vehicle ${i+1}`} value={`${v.year} ${v.make} ${v.model} · ${v.plate}`} />)}
          </Section>
        )}

        <Section title="Consent & Signature">
          <Row label="Background Check Consent" value={app.consent ? "✓ Agreed" : "Not agreed"} />
          <Row label="Digital Signature" value={app.signature} />
          <Row label="Signature Date" value={app.signature_date} />
        </Section>
      </div>
    </div>
  );
}
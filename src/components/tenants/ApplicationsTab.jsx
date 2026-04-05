import { useState, useMemo } from "react";
import { Search, Eye, CheckCircle, XCircle, Clock, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-emerald-100 text-emerald-700",
  denied: "bg-red-100 text-red-700",
};

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function ApplicationDetail({ app, properties, onBack, onStatusChange }) {
  const prop = properties.find(p => p.id === app.property_id);
  const rentAmount = prop ? 1500 : 1; // fallback
  const ratio = app.monthly_income && rentAmount ? (app.monthly_income / rentAmount).toFixed(1) : null;

  const approve = async () => {
    await base44.entities.RentalApplication.update(app.id, { status: "approved" });
    // Create tenant from application
    await base44.entities.Tenant.create({
      first_name: app.full_name.split(" ")[0],
      last_name: app.full_name.split(" ").slice(1).join(" ") || "",
      email: app.email,
      status: "pending",
    });
    onStatusChange();
    onBack();
  };

  const deny = async () => {
    await base44.entities.RentalApplication.update(app.id, { status: "denied" });
    if (app.email) {
      await base44.integrations.Core.SendEmail({
        to: app.email,
        subject: "Your Rental Application Status",
        body: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:32px auto;">
          <h2>Application Update</h2>
          <p>Dear ${app.full_name},</p>
          <p>Thank you for your interest in renting with us. After careful review, we are unable to approve your application at this time.</p>
          <p>We appreciate you taking the time to apply and wish you the best in your housing search.</p>
        </div>`,
      });
    }
    onStatusChange();
    onBack();
  };

  const markReview = async () => {
    await base44.entities.RentalApplication.update(app.id, { status: "under_review" });
    onStatusChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1"/>Back</Button>
        <h2 className="font-semibold text-lg">{app.full_name}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
          {app.status?.replace("_", " ")}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Personal Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Full Name" value={app.full_name} />
            <DetailRow label="Date of Birth" value={app.dob} />
            <DetailRow label="Email" value={app.email} />
            <DetailRow label="Current Address" value={app.current_address} />
            <DetailRow label="Time at Current" value={app.time_at_current} />
            <DetailRow label="Previous Address" value={app.previous_address} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Employment & Income</h3>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Employer" value={app.employer_name} />
            <DetailRow label="Job Title" value={app.job_title} />
            <DetailRow label="Monthly Income" value={app.monthly_income ? `$${app.monthly_income?.toLocaleString()}` : null} />
            <DetailRow label="Other Income" value={app.other_income ? `$${app.other_income?.toLocaleString()}` : null} />
            <DetailRow label="Supervisor" value={app.supervisor_name} />
            <DetailRow label="Supervisor Phone" value={app.supervisor_phone} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">References & Rental History</h3>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Prev Landlord" value={app.prev_landlord_name} />
            <DetailRow label="Prev Landlord Phone" value={app.prev_landlord_phone} />
            <DetailRow label="Reference 1" value={app.ref1_name ? `${app.ref1_name} (${app.ref1_relationship})` : null} />
            <DetailRow label="Ref 1 Phone" value={app.ref1_phone} />
            <DetailRow label="Reference 2" value={app.ref2_name ? `${app.ref2_name} (${app.ref2_relationship})` : null} />
            <DetailRow label="Ref 2 Phone" value={app.ref2_phone} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Additional Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Pets" value={app.has_pets ? `Yes (${app.pets?.length || 0})` : "No"} />
            <DetailRow label="Vehicles" value={app.vehicles?.length ? app.vehicles.length : "None"} />
            <DetailRow label="Consent" value={app.consent ? "✓ Agreed" : "Not agreed"} />
            <DetailRow label="Signed" value={app.signature_date} />
          </div>
          {app.gov_id_url && (
            <a href={app.gov_id_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary text-sm underline">View ID</a>
          )}
        </div>
      </div>

      {ratio && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Income-to-Rent Ratio</p>
            <p className="text-2xl font-bold" style={{ color: Number(ratio) >= 3 ? "#22C55E" : Number(ratio) >= 2 ? "#F59E0B" : "#EF4444" }}>{ratio}x</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {Number(ratio) >= 3 ? "Strong income relative to rent." : Number(ratio) >= 2 ? "Borderline — review carefully." : "Income may be insufficient."}
          </p>
        </div>
      )}

      {app.status !== "approved" && app.status !== "denied" && (
        <div className="flex gap-3 flex-wrap">
          {app.status !== "under_review" && (
            <Button variant="outline" onClick={markReview} className="gap-2"><Clock className="w-4 h-4"/>Mark Under Review</Button>
          )}
          <Button onClick={approve} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><CheckCircle className="w-4 h-4"/>Approve</Button>
          <Button onClick={deny} variant="destructive" className="gap-2"><XCircle className="w-4 h-4"/>Deny & Send Email</Button>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsTab({ applications, properties, onRefresh, search, setSearch }) {
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);

  const filtered = useMemo(() => {
    return applications.filter(a => {
      const s = search.toLowerCase();
      const matchSearch = !search || a.full_name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s);
      const matchProp = filterProperty === "all" || a.property_id === filterProperty;
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      return matchSearch && matchProp && matchStatus;
    });
  }, [applications, search, filterProperty, filterStatus]);

  if (selectedApp) {
    return <ApplicationDetail app={selectedApp} properties={properties} onBack={() => setSelectedApp(null)} onStatusChange={onRefresh} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search applicants…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Properties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Applicant</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Property</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Income</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Ratio</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No applications found</td></tr>
            ) : filtered.map(a => {
              const prop = properties.find(p => p.id === a.property_id);
              const ratio = a.monthly_income ? (a.monthly_income / 1500).toFixed(1) : "—";
              return (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedApp(a)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{prop?.nickname || prop?.address || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{a.created_date ? new Date(a.created_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-medium">{a.monthly_income ? `$${a.monthly_income.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 hidden xl:table-cell font-semibold" style={{ color: Number(ratio) >= 3 ? "#22C55E" : Number(ratio) >= 2 ? "#F59E0B" : "#EF4444" }}>{ratio}x</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600"}`}>
                      {a.status?.replace("_", " ") || "New"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Eye className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
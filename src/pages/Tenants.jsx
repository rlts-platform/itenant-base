import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Users, FileText, Clock, ClipboardList } from "lucide-react";
import { useLocation } from "react-router-dom";
import ExportButton from "../components/ExportButton";
import { formatDate, formatCurrency } from "@/lib/csvExport";
import TenantDetail from "./TenantDetail";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AllTenantsTab from "../components/tenants/AllTenantsTab";
import ApplicationsTab from "../components/tenants/ApplicationsTab";
import InvitesTab from "../components/tenants/InvitesTab";
import MoveOutsTab from "../components/tenants/MoveOutsTab";
import { useEffect, useState } from "react";

const TABS = [
{ id: "tenants", label: "All Tenants", icon: Users },
{ id: "applications", label: "Applications", icon: ClipboardList },
{ id: "invites", label: "Invites", icon: Clock },
{ id: "moveouts", label: "Move Outs", icon: FileText }];

export default function Tenants() {


  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invites, setInvites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tenants");
  const [selectedId, setSelectedId] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", status: "active", unit_id: "" });
  const [sendingInvite, setSendingInvite] = useState(null);
  const [search, setSearch] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const location = useLocation();

  const load = async () => {
    const [t, u, p, l, pay, inv, apps] = await Promise.all([
    base44.entities.Tenant.list("-created_date"),
    base44.entities.Unit.list(),
    base44.entities.Property.list(),
    base44.entities.Lease.list(),
    base44.entities.Payment.list("-date", 200),
    base44.entities.TenantInvite.list(),
    base44.entities.RentalApplication.list("-created_date")]
    );
    setTenants(t);setUnits(u);setProperties(p);setLeases(l);
    setPayments(pay);setInvites(inv);setApplications(apps);
    setLoading(false);
  };

  useEffect(() => {load();}, []);
  useEffect(() => {
    if (location.state?.openAdd) {openAdd();window.history.replaceState({}, "");}
  }, [location.state]);

  if (selectedId) return <TenantDetail tenantId={selectedId} onBack={() => setSelectedId(null)} />;

  const openAdd = () => {
    setEditing(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", status: "active", unit_id: "" });
    setOpen(true);
  };

  const save = async () => {
    let tenantId;
    if (editing) {
      await base44.entities.Tenant.update(editing.id, form);
      tenantId = editing.id;
    } else {
      const created = await base44.entities.Tenant.create({ ...form, status: "pending" });
      tenantId = created.id;
      await base44.functions.invoke("sendTenantInvite", { tenant_id: tenantId });
    }
    setOpen(false);
    load();
  };

  const resendInvite = async (t) => {
    setSendingInvite(t.id);
    await base44.functions.invoke("sendTenantInvite", { tenant_id: t.id });
    setSendingInvite(null);
    load();
  };

  const exportTenants = async (exportAll) => {
    let data = tenants;
    if (!exportAll && (search || filterProperty !== "all")) {
      data = tenants.filter(t => {
        const matchSearch = search === "" || `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) || t.email.includes(search);
        const matchFilter = filterProperty === "all" || tenants.some(t2 => t2.id === t.id && units.find(u => u.id === t2.unit_id)?.property_id === filterProperty);
        return matchSearch && matchFilter;
      });
    }
    const rows = data.map(t => {
      const lease = leases.find(l => l.tenant_id === t.id && l.status === "active");
      const unit = units.find(u => u.id === t.unit_id);
      const prop = properties.find(p => p.id === unit?.property_id);
      const thisMonthPayments = payments.filter(p => p.tenant_id === t.id && p.date?.startsWith(new Date().toISOString().slice(0, 7)));
      const invite = invites.find(i => i.tenant_id === t.id);
      return {
        "Full Name": `${t.first_name} ${t.last_name}`,
        "Email": t.email,
        "Phone": t.phone || "",
        "Property Address": prop?.address || "",
        "Unit Number": unit?.unit_number || "",
        "Lease Start Date": formatDate(lease?.start_date),
        "Lease End Date": formatDate(lease?.end_date),
        "Monthly Rent": formatCurrency(lease?.rent_amount),
        "Security Deposit": formatCurrency(lease?.deposit_amount),
        "Payment Status This Month": thisMonthPayments.length > 0 ? "Paid" : "Pending",
        "Invite Status": invite?.status || "active",
        "Emergency Contact Name": t.emergency_contact_name || "",
        "Emergency Contact Phone": t.emergency_contact_phone || ""
      };
    });
    return {
      headers: ["Full Name", "Email", "Phone", "Property Address", "Unit Number", "Lease Start Date", "Lease End Date", "Monthly Rent", "Security Deposit", "Payment Status This Month", "Invite Status", "Emergency Contact Name", "Emergency Contact Phone"],
      rows
    };
  };

  // Stats
  const activeLeases = leases.filter((l) => l.status === "active").length;
  const pendingInvites = invites.filter((i) => i.status === "pending").length;
  const appsWaiting = applications.filter((a) => a.status === "new" || a.status === "under_review").length;

  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);
  const moveOutCount = leases.filter((l) => l.status === "active" && l.end_date && new Date(l.end_date) <= thirtyDaysOut).length;

  const stats = [
  { label: "Total Tenants", value: tenants.length, color: "#7C6FCD" },
  { label: "Active Leases", value: activeLeases, color: "#22C55E" },
  { label: "Pending Invites", value: pendingInvites, color: "#F59E0B" },
  { label: "Applications Waiting", value: appsWaiting, color: "#3B82F6" }];


  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
       <div>
         <h1 className="text-2xl font-outfit font-bold">Tenant CRM</h1>
         <p className="text-sm text-muted-foreground mt-0.5">Manage all tenants, applications, and move-outs</p>
       </div>
       <div className="flex gap-2">
         {tab === "tenants" && <ExportButton pageName="Tenants" hasFilters={search || filterProperty !== "all"} onExport={exportTenants} />}
         <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />Add Tenant</Button>
       </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) =>
        <div key={i} className="bg-[hsl(var(--background-hsl))] p-5 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {TABS.map((t) =>
        <button
          key={t.id}
          onClick={() => {setTab(t.id);setSearch("");}}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all"
          style={{
            borderBottom: tab === t.id ? "2px solid #7C6FCD" : "2px solid transparent",
            color: tab === t.id ? "#7C6FCD" : "#6B7280"
          }}>
          
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {tab === "tenants" &&
      <AllTenantsTab
        tenants={tenants} units={units} properties={properties}
        leases={leases} payments={payments} invites={invites}
        onSelect={setSelectedId} onResendInvite={resendInvite} sendingInvite={sendingInvite}
        search={search} setSearch={setSearch}
        filterProperty={filterProperty} setFilterProperty={setFilterProperty} />

      }
      {tab === "applications" &&
      <ApplicationsTab
        applications={applications} properties={properties}
        onRefresh={load} search={search} setSearch={setSearch} />

      }
      {tab === "invites" &&
      <InvitesTab
        invites={invites} tenants={tenants}
        onRefresh={load} search={search} setSearch={setSearch} />

      }
      {tab === "moveouts" &&
      <MoveOutsTab
        tenants={tenants} leases={leases} units={units} properties={properties}
        onRefresh={load} />

      }

      {/* Add/Edit Tenant Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Tenant" : "Add Tenant"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input className="mt-1" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} /></div>
              <div><Label>Last Name</Label><Input className="mt-1" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm((f) => ({ ...f, unit_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>Unit {u.unit_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.first_name || !form.email}>Save & Send Invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}
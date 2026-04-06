import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFirstName } from "@/hooks/useFirstName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plug, Bell, CreditCard, User, Trash2, Upload, Copy, Check, Download } from "lucide-react";
import JSZip from 'jszip';
import { useAccount } from "../hooks/useAccount";
import { usePermissions } from "../hooks/usePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import IntegrationsTab from "../components/settings/IntegrationsTab";
import NotificationsTab from "../components/settings/NotificationsTab";
import BillingTab from "../components/settings/BillingTab";

const ALL_TABS = [
  { id: "account",       label: "Account",       icon: User },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "integrations",  label: "Add-ons",       icon: Plug },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function Settings() {
  const { user } = useAuth();
  const role = user?.role;
  const isTeamMember = role === 'team_member';
  const isPlatformOwner = role === 'platform_owner' || role === 'admin';
  const isClient = role === 'client';
  const isTenant = role === 'tenant';
  usePermissions('settings'); // redirects non-manager team members
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ company_name: "", plan_tier: "starter", subscription_status: "active", logo_url: "" });
  const [originalPlan, setOriginalPlan] = useState("starter");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planMessage, setPlanMessage] = useState(null); // { type: 'success'|'error', text }
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("account");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateClientId = (id) => {
    if (!id) return null;
    return "ITNT-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
  };

  const handleCopyClientId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const load = async () => {
    const accounts = await base44.entities.Account.filter({ owner_email: user?.email });
    if (accounts[0]) {
      setAccount(accounts[0]);
      const planTier = accounts[0].plan_tier || "starter";
      setForm({ company_name: accounts[0].company_name || "", plan_tier: planTier, subscription_status: accounts[0].subscription_status || "active", logo_url: accounts[0].logo_url || "" });
      setOriginalPlan(planTier);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    setSaving(true);
    setPlanMessage(null);
    const planChanged = isClient && form.plan_tier !== originalPlan;

    if (planChanged && account) {
      // Trigger billing flow for plan change
      let res;
      try {
        res = await base44.functions.invoke('changePlan', { account_id: account.id, new_plan: form.plan_tier });
      } catch (err) {
        setSaving(false);
        setPlanMessage({ type: 'error', text: 'Payment failed. Your plan has not been changed. Please update your payment method.' });
        setForm(f => ({ ...f, plan_tier: originalPlan }));
        return;
      }
      const data = res.data;
      if (data.error === 'no_payment_method') {
        setSaving(false);
        setPlanMessage({ type: 'error', text: 'Please add a payment method in the Billing tab before changing your plan.' });
        setForm(f => ({ ...f, plan_tier: originalPlan }));
        return;
      }
      if (data.error === 'payment_failed' || !data.success) {
        setSaving(false);
        setPlanMessage({ type: 'error', text: 'Payment failed. Your plan has not been changed. Please update your payment method.' });
        setForm(f => ({ ...f, plan_tier: originalPlan }));
        return;
      }
      // Success — show confirmation
      const dateStr = new Date(data.next_billing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const chargeText = data.prorated_amount > 0 ? `A pro-rated charge of $${data.prorated_amount.toFixed(2)} has been applied to your card on file.` : 'No charge was applied (plan downgrade or equal price).';
      setPlanMessage({ type: 'success', text: `Your plan has been updated. ${chargeText} Your next billing date is ${dateStr}.` });
      // Also save other fields
      await base44.entities.Account.update(account.id, { company_name: form.company_name, subscription_status: form.subscription_status, owner_email: user?.email });
      await load();
      setSaving(false);
      return;
    }

    // No plan change — normal save
    if (account) {
      await base44.entities.Account.update(account.id, { ...form, owner_email: user?.email });
    } else {
      const a = await base44.entities.Account.create({ ...form, owner_email: user?.email });
      setAccount(a);
    }
    window.dispatchEvent(new CustomEvent('accountLogoUpdated', { detail: { logo_url: form.logo_url } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_url: file_url }));
    setLogoUploading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete associated AppUser record
      const appUsers = await base44.entities.AppUser.filter({ user_email: user?.email });
      if (appUsers[0]) await base44.entities.AppUser.delete(appUsers[0].id);
      // Delete account
      if (account) await base44.entities.Account.delete(account.id);
      // Logout
      await base44.auth.logout();
    } catch (error) {
      alert("Error deleting account. Please try again.");
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [properties, units, tenants, leases, payments, teamMembers, documents] = await Promise.all([
        base44.entities.Property.filter({ account_id: account?.id || "" }),
        base44.entities.Unit.filter({ account_id: account?.id || "" }),
        base44.entities.Tenant.filter({ account_id: account?.id || "" }),
        base44.entities.Lease.filter({ account_id: account?.id || "" }),
        base44.entities.Payment.filter({ account_id: account?.id || "" }),
        base44.entities.TeamMember.filter({ account_id: account?.id || "" }),
        base44.entities.Document.filter({ account_id: account?.id || "" }),
      ]);

      const toCsv = (data) => {
        if (!data || data.length === 0) return "";
        const keys = Object.keys(data[0]);
        const headers = keys.join(",");
        const rows = data.map(row => keys.map(k => {
          const v = row[k];
          if (v === null || v === undefined) return "";
          if (typeof v === "object") return `"${JSON.stringify(v).replace(/"/g, '""')}"` ;
          return `"${String(v).replace(/"/g, '""')}"` ;
        }).join(","));
        return [headers, ...rows].join("\n");
      };

      const zip = new JSZip();
      zip.file("Properties.csv", toCsv(properties));
      zip.file("Units.csv", toCsv(units));
      zip.file("Tenants.csv", toCsv(tenants));
      zip.file("Leases.csv", toCsv(leases));
      zip.file("Payments.csv", toCsv(payments));
      zip.file("Team.csv", toCsv(teamMembers));
      zip.file("Documents_List.csv", toCsv(documents));

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `iTenant-Export-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();

      setExporting(false);
      setExportOpen(false);
      const { toast } = await import('sonner');
      toast.success("Your account export is downloading.");
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting account data. Please try again.");
      setExporting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Settings</h1><p className="text-sm mt-1" style={{ color: '#6B7280' }}>Manage your account, integrations, and preferences</p></div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit flex-wrap">
        {ALL_TABS.filter(t => !isTeamMember || (t.id !== 'billing' && t.id !== 'integrations')).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white shadow" : "hover:"}`}
            style={tab === t.id ? { color: '#1A1A2E' } : { color: '#6B7280' }}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {tab === "account" && (
        <div className="space-y-4">
          {!user?.full_name?.trim() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-yellow-700">!</span>
              </div>
              <p className="text-sm" style={{ color: '#92400E' }}>Add your name to personalize your experience</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Account Info</h2>
            <div>
              <Label>Company Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="px-4 py-2 rounded-lg border border-input bg-white text-sm font-medium hover:bg-secondary transition-colors" style={{ color: '#1A1A2E' }}>
                    {logoUploading ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                </label>
                {form.logo_url && (
                  <button onClick={() => setForm(f => ({ ...f, logo_url: '' }))} className="text-sm text-red-500 hover:underline">Remove</button>
                )}
              </div>
            </div>
            <div><Label>Company Name</Label><Input className="mt-1" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            {!isTenant && (
              <div><Label>Plan</Label>
                {isPlatformOwner ? (
                  <Select value={form.plan_tier} onValueChange={v => setForm(f => ({ ...f, plan_tier: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["starter","growth","pro","enterprise"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                ) : isClient ? (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-11 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm capitalize cursor-not-allowed select-none" style={{ color: '#1A1A2E' }}>{form.plan_tier}</div>
                    <button onClick={() => setTab("billing")} className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: '#7C6FCD', border: 'none', cursor: 'pointer', minHeight: 44 }}>Upgrade Plan</button>
                  </div>
                ) : (
                  <div className="mt-1 h-11 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm capitalize">{form.plan_tier}</div>
                )}
              </div>
            )}
            <div><Label>Subscription Status</Label>
              {isPlatformOwner ? (
                <Select value={form.subscription_status} onValueChange={v => setForm(f => ({ ...f, subscription_status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["active","trialing","past_due","canceled"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <div className="mt-1 h-11 px-3 flex items-center rounded-md border border-input bg-muted/40 text-sm capitalize">{form.subscription_status?.replace("_"," ")}</div>
              )}
            </div>
            {planMessage && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                planMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {planMessage.text}
              </div>
            )}
            <Button onClick={save} disabled={saving} className="gap-2"><Save className="w-4 h-4" />{saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}</Button>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-2">
           <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Your Profile</h2>
           <p className="text-sm" style={{ color: '#4B5563' }}>Name: {user?.full_name || "(Not set - add your name above)"}</p>
           <p className="text-sm" style={{ color: '#4B5563' }}>Email: {user?.email}</p>
           <p className="text-sm" style={{ color: '#4B5563' }}>Role: {user?.role}</p>
           {account?.id && (() => {
             const clientId = generateClientId(account.id);
             return (
               <div className="mt-3 pt-3 border-t border-border">
                 <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Client ID</p>
                 <div className="flex items-center gap-2">
                   <div className="flex-1 h-11 px-3 flex items-center rounded-md border text-sm font-mono font-bold select-all" style={{ backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', color: '#1A1A2E', cursor: 'default', userSelect: 'all' }} tabIndex={-1}>{clientId}</div>
                   <button onClick={() => handleCopyClientId(clientId)} className="flex items-center justify-center h-11 w-11 rounded-md border transition-colors" style={{ backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', cursor: 'pointer' }} title="Copy Client ID">
                     {copiedId ? <Check className="w-4 h-4" style={{ color: '#22C55E' }} /> : <Copy className="w-4 h-4" style={{ color: '#6B7280' }} />}
                   </button>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Reference this when contacting support</p>
               </div>
             );
           })()}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
           <h2 className="font-semibold" style={{ color: '#7F1D1D' }}>Danger Zone</h2>
           <p className="text-sm" style={{ color: '#991B1B' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
           <div className="flex gap-2">
             <Button onClick={() => setExportOpen(true)} variant="outline" className="gap-2 flex-1" style={{ color: '#7C6FCD', borderColor: '#7C6FCD' }}>
               <Download className="w-4 h-4" /> Export Account Data
             </Button>
             <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" className="gap-2 flex-1">
               <Trash2 className="w-4 h-4" /> Delete Account
             </Button>
           </div>
          </div>
        </div>
      )}

      {tab === "integrations" && account && (
        <IntegrationsTab account={account} onSaved={load} role={role} />
      )}
      {tab === "integrations" && !account && (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Save your account info first to configure integrations.</div>
      )}

      {tab === "notifications" && account && (
        <NotificationsTab account={account} onSaved={load} />
      )}
      {tab === "notifications" && !account && (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">Save your account info first to configure notifications.</div>
      )}

      {tab === "billing" && (
        <BillingTab account={account} />
      )}

      {/* Export Account Data Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Account Data</DialogTitle>
            <DialogDescription>We'll prepare a full export of your account. This includes your properties, units, tenants, leases, payments, documents, and team. Your download will begin shortly.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>Are you sure? This will permanently delete your account and all data. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
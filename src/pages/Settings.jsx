import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFirstName } from "@/hooks/useFirstName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plug, Bell, CreditCard, User, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import IntegrationsTab from "../components/settings/IntegrationsTab";
import NotificationsTab from "../components/settings/NotificationsTab";
import BillingTab from "../components/settings/BillingTab";

const TABS = [
  { id: "account",       label: "Account",       icon: User },
  { id: "integrations",  label: "Integrations",  icon: Plug },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing",       label: "Billing",       icon: CreditCard },
];

export default function Settings() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ company_name: "", plan_tier: "starter", subscription_status: "active" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("account");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const accounts = await base44.entities.Account.filter({ owner_email: user?.email });
    if (accounts[0]) {
      setAccount(accounts[0]);
      setForm({ company_name: accounts[0].company_name || "", plan_tier: accounts[0].plan_tier || "starter", subscription_status: accounts[0].subscription_status || "active" });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (account) await base44.entities.Account.update(account.id, { ...form, owner_email: user?.email });
    else { const a = await base44.entities.Account.create({ ...form, owner_email: user?.email }); setAccount(a); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Settings</h1><p className="text-sm mt-1" style={{ color: '#6B7280' }}>Manage your account, integrations, and preferences</p></div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
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
            <div><Label>Company Name</Label><Input className="mt-1" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div><Label>Plan</Label>
              <Select value={form.plan_tier} onValueChange={v => setForm(f => ({ ...f, plan_tier: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["starter","growth","pro","enterprise"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Subscription Status</Label>
              <Select value={form.subscription_status} onValueChange={v => setForm(f => ({ ...f, subscription_status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["active","trialing","past_due","canceled"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={save} className="gap-2"><Save className="w-4 h-4" />{saved ? "Saved!" : "Save Changes"}</Button>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-2">
           <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Your Profile</h2>
           <p className="text-sm" style={{ color: '#4B5563' }}>Name: {user?.full_name || "(Not set - add your name above)"}</p>
           <p className="text-sm" style={{ color: '#4B5563' }}>Email: {user?.email}</p>
           <p className="text-sm" style={{ color: '#4B5563' }}>Role: {user?.role}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
           <h2 className="font-semibold" style={{ color: '#7F1D1D' }}>Danger Zone</h2>
           <p className="text-sm" style={{ color: '#991B1B' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
           <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" className="gap-2">
             <Trash2 className="w-4 h-4" /> Delete Account
           </Button>
          </div>
          </div>
          )}

      {tab === "integrations" && account && (
        <IntegrationsTab account={account} onSaved={load} />
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
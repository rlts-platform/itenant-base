import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ company_name: "", plan_tier: "starter", subscription_status: "active" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Account.filter({ owner_email: user?.email }).then(accounts => {
      if (accounts[0]) { setAccount(accounts[0]); setForm({ company_name: accounts[0].company_name || "", plan_tier: accounts[0].plan_tier || "starter", subscription_status: accounts[0].subscription_status || "active" }); }
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (account) await base44.entities.Account.update(account.id, { ...form, owner_email: user?.email });
    else await base44.entities.Account.create({ ...form, owner_email: user?.email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-outfit font-700">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your account settings</p></div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Account Info</h2>
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
        <h2 className="font-semibold">Your Profile</h2>
        <p className="text-sm text-muted-foreground">Name: {user?.full_name}</p>
        <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
        <p className="text-sm text-muted-foreground">Role: {user?.role}</p>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users2, ArrowLeft, Save, Loader2, Trash2, UserCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PLANS = ["starter", "growth", "pro", "enterprise"];
const STATUSES = ["active", "trialing", "past_due", "canceled"];
const STATUS_COLOR = { active: "default", trialing: "outline", past_due: "destructive", canceled: "secondary" };

const planPrice = { starter: 29, growth: 79, pro: 149, enterprise: 299 };

function ClientDetail({ account, onBack, onSaved }) {
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [docs, setDocs] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [notes, setNotes] = useState(account.notes || "");
  const [plan, setPlan] = useState(account.plan_tier || "starter");
  const [status, setStatus] = useState(account.subscription_status || "active");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const loadTeamMembers = async () => {
    const members = await base44.entities.TeamMember.filter({ account_id: account.id }, "created_date");
    setTeamMembers(members);
  };

  useEffect(() => {
    Promise.all([
      base44.entities.Unit.filter({ account_id: account.id }),
      base44.entities.Tenant.filter({ account_id: account.id }),
      base44.entities.Document.filter({ account_id: account.id }),
    ]).then(([u, t, d]) => {
      setUnits(u);
      setTenants(t);
      setDocs(d);
    });
    loadTeamMembers();
  }, [account.id]);

  const removeTeamMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} (${member.email}) from this account? This cannot be undone.`)) return;
    setRemovingId(member.id);
    // Remove TeamMember record and unlink their AppUser
    await base44.entities.TeamMember.delete(member.id);
    const appUsers = await base44.entities.AppUser.filter({ user_email: member.email });
    if (appUsers.length > 0) {
      await base44.entities.AppUser.update(appUsers[0].id, { account_id: null, role: "client", team_role: null });
    }
    setRemovingId(null);
    loadTeamMembers();
  };

  const tmSupportId = (index) => `${account.client_id} / TM-${index + 1}`;

  const save = async () => {
    setSaving(true);
    await base44.entities.Account.update(account.id, {
      notes,
      plan_tier: plan,
      subscription_status: status,
      mrr: planPrice[plan] || 0,
    });
    setSaving(false);
    onSaved();
  };

  const Row = ({ label, value }) => (
    <div className="flex gap-4 text-sm py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground w-44 shrink-0">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-outfit font-bold">{account.company_name}</h1>
          <p className="text-sm text-muted-foreground">{account.owner_email}</p>
        </div>
        <Badge variant={STATUS_COLOR[account.subscription_status] || "secondary"}>{account.subscription_status || "—"}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Account Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Account Info</h2>
          <Row label="Business Name" value={account.company_name} />
          <Row label="Client ID" value={<code className="font-mono font-bold text-primary">{account.client_id || "—"}</code>} />
          <Row label="Owner Email" value={account.owner_email} />
          <Row label="Signup Date" value={account.created_date ? new Date(account.created_date).toLocaleDateString() : null} />
          <Row label="Plan Tier" value={<span className="capitalize">{account.plan_tier}</span>} />
          <Row label="Status" value={<span className="capitalize">{account.subscription_status}</span>} />
        </div>

        {/* Usage Stats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Usage</h2>
          <Row label="Total Units" value={units.length} />
          <Row label="Total Tenants" value={tenants.length} />
          <Row label="Documents Stored" value={docs.length} />
          <Row label="MRR" value={account.mrr ? `$${account.mrr}` : null} />
        </div>

        {/* Change Plan & Status */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Manage Account</h2>
          <div>
            <Label className="mb-1.5 block">Change Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLANS.map(p => (
                  <SelectItem key={p} value={p}>
                    <span className="capitalize">{p}</span> — ${planPrice[p]}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Subscription Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}><span className="capitalize">{s.replace("_"," ")}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save} disabled={saving} className="gap-2 w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Internal Notes</h2>
          <Textarea
            rows={6}
            placeholder="Add private notes about this client (only visible to platform owner)…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Only visible to platform owner.</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Team Members ({teamMembers.length})</h2>
          </div>
          <p className="text-xs text-muted-foreground">Support ID format: {account.client_id} / TM-N</p>
        </div>
        {teamMembers.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No team members on this account</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>
                {["Support ID", "Name", "Email", "Role", "Date Added", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {tmSupportId(i)}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs bg-secondary px-2 py-0.5 rounded-full">{m.team_role?.replace("_", " ") || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {m.created_date ? new Date(m.created_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeTeamMember(m)}
                      disabled={removingId === m.id}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      title="Remove team member"
                    >
                      {removingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Removing a team member immediately revokes their access. This action is for support and security purposes only.</p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerClients() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const a = await base44.entities.Account.list("-created_date");
    setAccounts(a); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (selected) return (
    <ClientDetail
      account={selected}
      onBack={() => setSelected(null)}
      onSaved={() => { load(); setSelected(null); }}
    />
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-outfit font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{accounts.length} client accounts</p>
        </div>
        <input
          type="text"
          placeholder="Search by Client ID or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-2 bg-background w-64 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No clients yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Client ID","Company","Plan","Status","MRR","Owner Email","Joined",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {accounts
                .filter(a => !search || a.client_id?.toLowerCase().includes(search.toLowerCase()) || a.company_name?.toLowerCase().includes(search.toLowerCase()))
                .map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`${i % 2 === 0 ? "bg-card" : "bg-secondary/20"} cursor-pointer hover:bg-secondary/40 transition-colors`}
                >
                  <td className="px-4 py-3"><code className="text-xs font-mono font-bold text-primary">{a.client_id || "—"}</code></td>
                  <td className="px-4 py-3 font-medium">{a.company_name}</td>
                  <td className="px-4 py-3 capitalize">{a.plan_tier || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_COLOR[a.subscription_status] || "secondary"}>{a.subscription_status || "—"}</Badge></td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{a.mrr ? `$${a.mrr}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.owner_email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.created_date ? new Date(a.created_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary hover:underline">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
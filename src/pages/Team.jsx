import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { Plus, Users2, Pencil, Trash2, Send, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const TEAM_ROLES = [
  { value: "manager", label: "Manager", desc: "Full access to all data, cannot change billing" },
  { value: "maintenance", label: "Maintenance", desc: "Work orders and vendors only" },
  { value: "leasing", label: "Leasing Agent", desc: "Properties, units, tenants, leases, applications" },
  { value: "accountant", label: "Accountant", desc: "Payments, financials, and documents only" },
  { value: "readonly", label: "Read Only", desc: "Can view everything but cannot create or edit" },
];

export default function Team() {
  const { user } = useAuth();
  const { canAccess } = usePermissions('team');
  const [members, setMembers] = useState([]);
  const [account, setAccount] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", team_role: "manager" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  const load = async () => {
    const accounts = await base44.entities.Account.filter({ owner_email: user?.email });
    const acct = accounts[0];
    setAccount(acct);
    if (acct) {
      const m = await base44.entities.TeamMember.filter({ account_id: acct.id });
      setMembers(m);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", team_role: "manager" });
    setOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, email: m.email, team_role: m.team_role || "manager" });
    setOpen(true);
  };

  const save = async () => {
    if (editing) {
      await base44.entities.TeamMember.update(editing.id, { name: form.name, team_role: form.team_role });
    } else {
      const created = await base44.entities.TeamMember.create({
        name: form.name,
        email: form.email,
        team_role: form.team_role,
        status: 'invited',
        account_id: account?.id || ''
      });
      await base44.functions.invoke('inviteTeamMember', { team_member_id: created.id });
    }
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    await base44.entities.TeamMember.delete(id);
    load();
  };

  const resendInvite = async (m) => {
    setSending(m.id);
    await base44.functions.invoke('inviteTeamMember', { team_member_id: m.id });
    setSending(null);
  };

  const roleLabel = (r) => TEAM_ROLES.find(x => x.value === r)?.label || r;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-outfit font-700">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />Invite Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No team members yet</p>
          <p className="text-sm text-muted-foreground mt-1">Invite your first team member to get started</p>
          <Button onClick={openAdd} className="mt-4 gap-2"><Plus className="w-4 h-4" />Invite Member</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Permissions</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-5 py-3 font-medium">{m.name}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{m.email}</td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-xs bg-secondary px-2 py-0.5 rounded-full">{roleLabel(m.team_role)}</span>
                  </td>
                  <td className="px-5 py-3">
                    {m.status === 'active'
                      ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                      : <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Invited</Badge>
                    }
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {m.status === 'invited' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={sending === m.id} onClick={() => resendInvite(m)}>
                          <Send className="w-3 h-3" />{sending === m.id ? "Sending…" : "Resend"}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Permissions" : "Invite Team Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editing} />
              </div>
            </div>
            <div>
              <Label>Team Role</Label>
              <Select value={form.team_role} onValueChange={v => setForm(f => ({ ...f, team_role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{r.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name || (!editing && !form.email)}>
              {editing ? "Save Changes" : "Send Invite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
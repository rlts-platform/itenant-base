import { useMemo, useState } from "react";
import { Send, Ban, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function InvitesTab({ invites, tenants, onRefresh, search, setSearch }) {
  const [loading, setLoading] = useState(null);

  const withTenant = useMemo(() => invites.map(inv => ({
    ...inv,
    tenant: tenants.find(t => t.id === inv.tenant_id),
  })).filter(inv => {
    const s = search.toLowerCase();
    return !search ||
      inv.tenant?.first_name?.toLowerCase().includes(s) ||
      inv.tenant?.last_name?.toLowerCase().includes(s) ||
      inv.email?.toLowerCase().includes(s);
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), [invites, tenants, search]);

  const resend = async (inv) => {
    setLoading(inv.id);
    await base44.functions.invoke("sendTenantInvite", { tenant_id: inv.tenant_id });
    setLoading(null);
    onRefresh();
  };

  const revoke = async (inv) => {
    await base44.entities.TenantInvite.update(inv.id, { status: "expired" });
    onRefresh();
  };

  const statusBadge = (status) => {
    if (status === "accepted") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Accepted</span>;
    if (status === "expired") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1"><Clock className="w-3 h-3"/>Expired</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Send className="w-3 h-3"/>Pending</span>;
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search invites…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Sent</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Expires</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {withTenant.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No invites found</td></tr>
            ) : withTenant.map(inv => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {inv.tenant ? `${inv.tenant.first_name} ${inv.tenant.last_name}` : "Unknown"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{inv.email}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {inv.created_date ? new Date(inv.created_date).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {inv.status !== "accepted" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={loading === inv.id} onClick={() => resend(inv)}>
                        <Send className="w-3 h-3"/>{loading === inv.id ? "…" : "Resend"}
                      </Button>
                    )}
                    {inv.status === "pending" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={() => revoke(inv)}>
                        <Ban className="w-3 h-3"/>Revoke
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
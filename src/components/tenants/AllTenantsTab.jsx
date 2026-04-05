import { useState, useMemo } from "react";
import { Search, ChevronRight, Send, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function paymentBadge(paid) {
  if (paid === "paid") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Paid</span>;
  if (paid === "overdue") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Overdue</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>;
}

function inviteBadge(inv) {
  if (!inv) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No Invite</span>;
  if (inv.status === "accepted") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>;
  if (inv.status === "expired") return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1"><Clock className="w-3 h-3"/>Expired</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Send className="w-3 h-3"/>Invited</span>;
}

export default function AllTenantsTab({ tenants, units, properties, leases, payments, invites, onSelect, onResendInvite, sendingInvite, search, setSearch, filterProperty, setFilterProperty }) {
  const [sort, setSort] = useState("name");

  const getUnit = (id) => units.find(u => u.id === id);
  const getProperty = (unitId) => {
    const unit = getUnit(unitId);
    if (!unit) return null;
    return properties.find(p => p.id === unit.property_id);
  };
  const getLatestInvite = (tenantId) => invites
    .filter(i => i.tenant_id === tenantId)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;

  const getActiveLease = (tenantId) => leases
    .filter(l => l.tenant_id === tenantId && l.status === "active")
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0] || null;

  const getPaymentStatus = (tenantId) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthPayments = payments.filter(p => p.tenant_id === tenantId && new Date(p.date) >= monthStart);
    if (monthPayments.some(p => p.status === "confirmed")) return "paid";
    const lease = getActiveLease(tenantId);
    if (lease && now.getDate() > 5) return "overdue";
    return "pending";
  };

  const filtered = useMemo(() => {
    let list = [...tenants];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(s) ||
        t.email?.toLowerCase().includes(s) ||
        getUnit(t.unit_id)?.unit_number?.toLowerCase().includes(s)
      );
    }
    if (filterProperty && filterProperty !== "all") {
      list = list.filter(t => {
        const prop = getProperty(t.unit_id);
        return prop?.id === filterProperty;
      });
    }
    if (sort === "name") list.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
    if (sort === "rent") list.sort((a, b) => (getActiveLease(b.tenant_id)?.rent_amount || 0) - (getActiveLease(a.tenant_id)?.rent_amount || 0));
    return list;
  }, [tenants, search, filterProperty, sort, units, properties]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, unit…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Properties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="rent">Sort: Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Unit / Property</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Lease</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Rent</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Invite</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No tenants found</td></tr>
              ) : filtered.map(t => {
                const unit = getUnit(t.unit_id);
                const prop = getProperty(t.unit_id);
                const lease = getActiveLease(t.id);
                const inv = getLatestInvite(t.id);
                const payStatus = getPaymentStatus(t.id);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => onSelect(t.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-sm shrink-0">
                          {t.first_name?.[0]}{t.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{t.first_name} {t.last_name}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {unit ? <div><p className="font-medium">Unit {unit.unit_number}</p><p className="text-xs text-muted-foreground">{prop?.nickname || prop?.address || "—"}</p></div> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {lease ? <>{new Date(lease.start_date).toLocaleDateString()} – {new Date(lease.end_date).toLocaleDateString()}</> : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell font-medium">
                      {lease ? `$${lease.rent_amount?.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">{paymentBadge(payStatus)}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">{inviteBadge(inv)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {inv?.status !== "accepted" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2"
                            disabled={sendingInvite === t.id}
                            onClick={() => onResendInvite(t)}>
                            {sendingInvite === t.id ? "…" : <Send className="w-3 h-3" />}
                          </Button>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
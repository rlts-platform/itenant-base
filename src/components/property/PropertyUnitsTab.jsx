import { Badge } from "@/components/ui/badge";

const statusColor = { vacant: "secondary", occupied: "default" };

export default function PropertyUnitsTab({ units, tenants, leases }) {
  const getTenant = (unitId) => tenants.find(t => t.unit_id === unitId);
  const getLease = (tenantId) => leases
    .filter(l => l.tenant_id === tenantId && l.status === "active")
    .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];

  if (units.length === 0) return (
    <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground">
      No units for this property yet.
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-muted-foreground text-xs">
          <tr>
            {["Unit","Beds","Baths","Sq Ft","Rent","Tenant","Lease End","Status"].map(h => (
              <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((u, i) => {
            const tenant = getTenant(u.id);
            const lease = tenant ? getLease(tenant.id) : null;
            return (
              <tr key={u.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                <td className="px-4 py-3 font-semibold">Unit {u.unit_number}</td>
                <td className="px-4 py-3">{u.bedrooms ?? "—"}</td>
                <td className="px-4 py-3">{u.bathrooms ?? "—"}</td>
                <td className="px-4 py-3">{u.sqft ? `${u.sqft.toLocaleString()} sqft` : "—"}</td>
                <td className="px-4 py-3 font-medium">{u.rent_amount ? `$${u.rent_amount.toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">{tenant ? `${tenant.first_name} ${tenant.last_name}` : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{lease?.end_date || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusColor[u.status] || "secondary"}>{u.status || "vacant"}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
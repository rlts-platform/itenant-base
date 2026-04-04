import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users2, Building2, Home, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OwnerDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([base44.entities.Account.list(), base44.entities.Property.list(), base44.entities.Unit.list(), base44.entities.Tenant.list()])
      .then(([acc, props, units, tenants]) => {
        setAccounts(acc);
        const mrr = acc.reduce((s, a) => s + (a.mrr || 0), 0);
        setStats({ properties: props.length, units: units.length, tenants: tenants.length, mrr });
        setLoading(false);
      });
  }, []);

  const statusColor = { active: "default", trialing: "outline", past_due: "destructive", canceled: "secondary" };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-outfit font-700">Platform Overview</h1><p className="text-sm text-muted-foreground mt-1">All clients and revenue at a glance</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: accounts.length, icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Properties", value: stats.properties, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Units", value: stats.units, icon: Home, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Platform MRR", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-outfit font-700">{c.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold">All Clients</h2></div>
        {accounts.length === 0 ? (
          <div className="p-16 text-center"><Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No clients yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Company","Plan","Status","MRR","Owner",""].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {accounts.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-medium">{a.company_name}</td>
                  <td className="px-4 py-3 capitalize">{a.plan_tier || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[a.subscription_status] || "secondary"}>{a.subscription_status || "—"}</Badge></td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{a.mrr ? `$${a.mrr.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.owner_email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
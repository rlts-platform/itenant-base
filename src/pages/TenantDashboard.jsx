import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useFirstName } from "@/hooks/useFirstName";
import { Link } from "react-router-dom";
import { DollarSign, Wrench, FileText, MessageSquare, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [lease, setLease] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    async function load() {
      const tenants = await base44.entities.Tenant.filter({ email: user?.email });
      const t = tenants[0];
      setTenant(t);
      if (t) {
        const [leases, wo, pays, accountsRes, broadcasts] = await Promise.all([
          base44.entities.Lease.filter({ tenant_id: t.id }),
          base44.entities.WorkOrder.filter({ tenant_id: t.id }),
          base44.entities.Payment.filter({ tenant_id: t.id }),
          t.account_id ? base44.entities.Account.filter({ id: t.account_id }) : Promise.resolve([]),
          t.account_id ? base44.entities.Broadcast.filter({ account_id: t.account_id }) : Promise.resolve([]),
        ]);
        setLease(leases.find(l => l.status === "active") || leases[0] || null);
        setOrders(wo.filter(w => w.status !== "closed").slice(0, 3));
        setPayments(pays.slice(0, 3));
        const account = accountsRes[0];
        if (account) {
          const alerts = broadcasts.filter(b =>
            b.type === "emergency_alert" &&
            b.sent_at &&
            (b.recipient_mode === "all_tenants" || b.recipient_tenant_ids?.includes(t.id))
          );
          setEmergencyAlerts(alerts.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)));
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const { firstName } = useFirstName(user);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {emergencyAlerts.map(alert => (
        !dismissedAlerts.includes(alert.id) && (
          <div key={alert.id} className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700">🚨 Emergency Alert</p>
              <p className="font-semibold text-sm mt-1 text-red-700">{alert.subject}</p>
            </div>
            <button
              onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
              className="text-red-600 hover:text-red-700 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )
      ))}

      <div>
        <h1 className="text-2xl font-outfit font-700">Welcome, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your rental overview</p>
      </div>

      {lease && (
        <div className="bg-primary text-white rounded-xl p-5">
          <p className="text-sm text-white/70 mb-1">Current Lease</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-outfit font-700">${lease.rent_amount?.toLocaleString()}/mo</p>
              <p className="text-sm text-white/80 mt-1">{lease.start_date} — {lease.end_date}</p>
            </div>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{lease.status}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pay Rent", icon: DollarSign, to: "/tenant/pay", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Maintenance", icon: Wrench, to: "/tenant/maintenance", color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Documents", icon: FileText, to: "/tenant/documents", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Messages", icon: MessageSquare, to: "/tenant/messages", color: "text-violet-600", bg: "bg-violet-50" },
        ].map(c => (
          <Link key={c.label} to={c.to} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <span className="text-sm font-medium">{c.label}</span>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Open Requests</h2>
            <Link to="/tenant/maintenance" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                <AlertTriangle className={`w-4 h-4 ${o.urgency === "emergency" ? "text-red-500" : o.urgency === "urgent" ? "text-orange-500" : "text-yellow-500"}`} />
                <span className="text-sm">{o.summary}</span>
                <span className="ml-auto text-xs text-muted-foreground">{o.status?.replace("_"," ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
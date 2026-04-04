import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Home, Users, CreditCard, Wrench, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ClientDashboard() {
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0, payments: 0, openOrders: 0, revenue: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [props, units, tenants, payments, orders] = await Promise.all([
        base44.entities.Property.list(),
        base44.entities.Unit.list(),
        base44.entities.Tenant.filter({ status: "active" }),
        base44.entities.Payment.list("-date", 5),
        base44.entities.WorkOrder.filter({ status: "new" }),
      ]);
      const revenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
      setStats({ properties: props.length, units: units.length, tenants: tenants.length, payments: payments.length, openOrders: orders.length, revenue });
      setRecentPayments(payments.slice(0, 5));
      setOpenOrders(orders.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Properties", value: stats.properties, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", to: "/properties" },
    { label: "Units", value: stats.units, icon: Home, color: "text-violet-600", bg: "bg-violet-50", to: "/units" },
    { label: "Active Tenants", value: stats.tenants, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", to: "/tenants" },
    { label: "Open Work Orders", value: stats.openOrders, icon: Wrench, color: "text-orange-600", bg: "bg-orange-50", to: "/maintenance" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-outfit font-700 text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back — here's what's happening</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-outfit font-700">{c.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Payments</h2>
            <Link to="/payments" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">${p.amount}</span>
                    <span className="text-xs text-muted-foreground">{p.method}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Open Work Orders</h2>
            <Link to="/maintenance" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {openOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No open work orders</p>
          ) : (
            <div className="space-y-3">
              {openOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${o.urgency === "emergency" ? "text-red-500" : o.urgency === "urgent" ? "text-orange-500" : "text-yellow-500"}`} />
                    <span className="text-sm font-medium truncate max-w-[180px]">{o.summary}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.urgency === "emergency" ? "bg-red-100 text-red-700" : o.urgency === "urgent" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>{o.urgency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Building2, Home, Users, Wrench, DollarSign, AlertTriangle, CheckCircle, Plus, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AnalyticsPreview from "../components/analytics/AnalyticsPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const STAT_CARDS = [
  { key: "properties", label: "Properties", icon: Building2, bg: "bg-blue-500", to: "/properties" },
  { key: "units", label: "Units", icon: Home, bg: "bg-green-500", to: "/units" },
  { key: "tenants", label: "Tenants", icon: Users, bg: "bg-violet-500", to: "/tenants" },
  { key: "openOrders", label: "Open Maintenance", icon: Wrench, bg: "bg-orange-500", to: "/maintenance" },
  { key: "revenue", label: "Collected", icon: DollarSign, bg: "bg-emerald-500", to: "/payments", prefix: "$" },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0, openOrders: 0, revenue: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [allTenants, setAllTenants] = useState([]);

  // Quick action dialogs
  const [woOpen, setWoOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [woForm, setWoForm] = useState({ summary: "", category: "plumbing", urgency: "normal" });
  const [payForm, setPayForm] = useState({ tenant_id: "", amount: "", method: "check", date: new Date().toISOString().split("T")[0] });
  const [savingWo, setSavingWo] = useState(false);
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    async function load() {
      const [props, units, tenants, payments, orders, leases] = await Promise.all([
        base44.entities.Property.list(),
        base44.entities.Unit.list(),
        base44.entities.Tenant.filter({ status: "active" }),
        base44.entities.Payment.list("-date", 20),
        base44.entities.WorkOrder.filter({ status: "new" }),
        base44.entities.Lease.filter({ status: "active" }),
      ]);
      const revenue = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + (p.amount || 0), 0);
      setStats({ properties: props.length, units: units.length, tenants: tenants.length, openOrders: orders.length, revenue });
      setRecentPayments(payments.slice(0, 5));
      setOpenOrders(orders.slice(0, 5));
      setAllTenants(tenants);

      // Overdue: active leases whose tenant has no confirmed payment this calendar month
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const paidThisMonth = new Set(
        payments.filter(p => p.status === "confirmed" && p.date?.startsWith(monthStr)).map(p => p.tenant_id)
      );
      const overdueLeases = leases.filter(l => !paidThisMonth.has(l.tenant_id));
      setOverdueCount(overdueLeases.length);
      setOverdueAmount(overdueLeases.reduce((s, l) => s + (l.rent_amount || 0), 0));

      setLoading(false);
    }
    load();
  }, []);

  const submitWorkOrder = async () => {
    setSavingWo(true);
    await base44.entities.WorkOrder.create({ ...woForm, status: "new" });
    setSavingWo(false);
    setWoOpen(false);
    setWoForm({ summary: "", category: "plumbing", urgency: "normal" });
  };

  const submitPayment = async () => {
    setSavingPay(true);
    await base44.entities.Payment.create({ ...payForm, amount: Number(payForm.amount), status: "confirmed" });
    setSavingPay(false);
    setPayOpen(false);
    setPayForm({ tenant_id: "", amount: "", method: "check", date: new Date().toISOString().split("T")[0] });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-outfit font-800 text-foreground leading-tight">
          Welcome back,<br />{firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">Here's what's happening with your properties today</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(c => {
          const val = stats[c.key];
          const display = c.prefix ? `${c.prefix}${val.toLocaleString()}` : val;
          return (
            <motion.div key={c.key} variants={item}>
              <Link to={c.to} className="flex items-center justify-between bg-white rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{c.label}</p>
                  <p className="text-3xl font-outfit font-800 text-foreground">{display}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                  <c.icon className="w-7 h-7 text-white" />
                </div>
              </Link>
            </motion.div>
          );
        })}
        {/* Overdue Rent card */}
        <motion.div variants={item}>
          <Link to="/payments" className="flex items-center justify-between bg-white rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overdue Rent</p>
              <p className="text-3xl font-outfit font-800 text-foreground">{overdueCount}</p>
              {overdueAmount > 0 && <p className="text-xs text-red-500 font-medium mt-0.5">${overdueAmount.toLocaleString()} outstanding</p>}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/properties", { state: { openAdd: true } })}
            className="flex flex-col items-center gap-2 bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Add Property</span>
          </button>
          <button
            onClick={() => navigate("/tenants", { state: { openAdd: true } })}
            className="flex flex-col items-center gap-2 bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <span className="text-sm font-semibold">Invite Tenant</span>
          </button>
          <button
            onClick={() => setWoOpen(true)}
            className="flex flex-col items-center gap-2 bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-semibold">Create Work Order</span>
          </button>
          <button
            onClick={() => setPayOpen(true)}
            className="flex flex-col items-center gap-2 bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold">Record Payment</span>
          </button>
        </div>
      </motion.div>

      {/* Work Order Dialog */}
      <Dialog open={woOpen} onOpenChange={setWoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Work Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Summary</Label><Input className="mt-1" value={woForm.summary} onChange={e => setWoForm(f => ({ ...f, summary: e.target.value }))} placeholder="e.g. Leaking faucet in unit 3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={woForm.category} onValueChange={v => setWoForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["plumbing","electrical","hvac","appliance","pest","structural","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Urgency</Label>
                <Select value={woForm.urgency} onValueChange={v => setWoForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["normal","urgent","emergency"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWoOpen(false)}>Cancel</Button>
            <Button onClick={submitWorkOrder} disabled={savingWo || !woForm.summary}>{savingWo ? "Saving…" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tenant</Label>
              <Select value={payForm.tenant_id} onValueChange={v => setPayForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{allTenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" className="mt-1" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label>Date</Label><Input type="date" className="mt-1" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div><Label>Method</Label>
              <Select value={payForm.method} onValueChange={v => setPayForm(f => ({ ...f, method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["check","money_order","cash","zelle"].map(m => <SelectItem key={m} value={m}>{m.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={submitPayment} disabled={savingPay || !payForm.tenant_id || !payForm.amount}>{savingPay ? "Saving…" : "Record"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnalyticsPreview />

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.35 }} className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Payments</h2>
            <Link to="/payments" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payments yet</p>
          ) : (
            <div className="space-y-1">
              {recentPayments.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">${p.amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.method?.replace("_"," ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : p.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.35 }} className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Open Work Orders</h2>
            <Link to="/maintenance" className="text-xs text-primary hover:underline font-medium">View all</Link>
          </div>
          {openOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No open work orders 🎉</p>
          ) : (
            <div className="space-y-1">
              {openOrders.map((o, i) => (
                <motion.div key={o.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${o.urgency === "emergency" ? "bg-red-100" : o.urgency === "urgent" ? "bg-orange-100" : "bg-yellow-100"}`}>
                      <AlertTriangle className={`w-4 h-4 ${o.urgency === "emergency" ? "text-red-600" : o.urgency === "urgent" ? "text-orange-500" : "text-yellow-600"}`} />
                    </div>
                    <p className="text-sm font-medium truncate max-w-[160px]">{o.summary}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${o.urgency === "emergency" ? "bg-red-100 text-red-700" : o.urgency === "urgent" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>{o.urgency}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
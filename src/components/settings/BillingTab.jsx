import { useState, useEffect } from "react";
import { CreditCard, Download, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const PLAN_PRICE = { starter: 0, growth: 29, pro: 79, enterprise: 299 };
const PLAN_LIMITS = {
  starter:    { units: 3,        tenants: 3 },
  growth:     { units: 15,       tenants: 15 },
  pro:        { units: 50,       tenants: 50 },
  enterprise: { units: Infinity, tenants: Infinity },
};
const STATUS_COLOR = { active: "default", trialing: "outline", past_due: "destructive", canceled: "secondary" };

function generateInvoices(account) {
  const invoices = [];
  const price = PLAN_PRICE[account?.plan_tier] || 0;
  const start = account?.created_date ? new Date(account.created_date) : new Date();
  const now = new Date();
  let d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= now && invoices.length < 12) {
    invoices.unshift({
      id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
      date: d.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      amount: price,
      status: "Paid",
    });
    d.setMonth(d.getMonth() + 1);
  }
  return invoices;
}

function ProgressBar({ value, max, label }) {
  const pct = max === Infinity ? 0 : Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#7C6FCD";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium" style={{ color: "#1A1A2E" }}>{label}</span>
        <span style={{ color: "#6B7280" }}>{max === Infinity ? `${value} / Unlimited` : `${value} / ${max}`}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "#E9E6FF" }}>
        {max !== Infinity && (
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        )}
        {max === Infinity && (
          <div className="h-2 rounded-full" style={{ width: "20%", background: "#7C6FCD" }} />
        )}
      </div>
    </div>
  );
}

export default function BillingTab({ account }) {
  const [unitCount, setUnitCount] = useState(0);
  const [tenantCount, setTenantCount] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelInput, setCancelInput] = useState("");
  const [canceling, setCanceling] = useState(false);

  const plan = account?.plan_tier || "starter";
  const price = PLAN_PRICE[plan];
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  const invoices = generateInvoices(account);

  const nextBillingDate = account?.next_billing_date
    ? new Date(account.next_billing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  useEffect(() => {
    if (!account?.id) return;
    base44.entities.Unit.filter({ account_id: account.id }).then(r => setUnitCount(r.length)).catch(() => {});
    base44.entities.Tenant.filter({ account_id: account.id }).then(r => setTenantCount(r.length)).catch(() => {});
  }, [account?.id]);

  const downloadInvoice = (inv) => {
    const content = `iTenant Invoice\n\nInvoice #: ${inv.id}\nDate: ${inv.date}\nPlan: ${plan} Plan\nAmount: $${inv.amount}.00\nStatus: ${inv.status}\n\nThank you for your business.`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${inv.id}.txt`;
    a.click();
  };

  const handleCancel = async () => {
    if (cancelInput !== "CANCEL") return;
    setCanceling(true);
    await base44.entities.Account.update(account.id, { subscription_status: "canceled" });
    setCanceling(false);
    setCancelOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold capitalize">{plan} Plan</p>
              <p className="text-sm text-muted-foreground">
                {price === 0 ? "Free" : `$${price}/month · billed monthly`}
              </p>
              {nextBillingDate !== "—" && (
                <p className="text-xs text-muted-foreground">Next billing: {nextBillingDate}</p>
              )}
            </div>
          </div>
          <Badge variant={STATUS_COLOR[account?.subscription_status] || "secondary"}>
            {account?.subscription_status?.replace("_", " ") || "—"}
          </Badge>
        </div>

        {/* Usage */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usage</p>
          <ProgressBar value={unitCount} max={limits.units} label="Units" />
          <ProgressBar value={tenantCount} max={limits.tenants} label="Tenants" />
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Payment Method</h3>
        {plan === "starter" ? (
          <p className="text-sm text-muted-foreground">No payment method required on the free plan.</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Visa ending in 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/2027</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">Update Payment Method</Button>
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Invoice History</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No invoices yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                {["Invoice", "Period", "Amount", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.id}</td>
                  <td className="px-4 py-3 font-medium">{inv.date}</td>
                  <td className="px-4 py-3 text-emerald-700 font-semibold">${inv.amount}.00</td>
                  <td className="px-4 py-3"><Badge variant="default" className="text-xs">{inv.status}</Badge></td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={() => downloadInvoice(inv)}>
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cancel Subscription */}
      {account?.subscription_status !== "canceled" && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setCancelOpen(true)}
            className="text-sm text-red-500 hover:text-red-700 underline underline-offset-2"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: "#1A1A2E" }}>Cancel Subscription?</h3>
            </div>
            <p className="text-sm mb-2" style={{ color: "#4B5563" }}>
              Your access will continue until the end of the current billing period. After that:
            </p>
            <ul className="text-sm mb-4 space-y-1 list-disc list-inside" style={{ color: "#6B7280" }}>
              <li>Your data will be retained for <strong>30 days</strong></li>
              <li>After 30 days, all data will be permanently deleted</li>
              <li>This action cannot be undone</li>
            </ul>
            <p className="text-sm font-semibold mb-2" style={{ color: "#1A1A2E" }}>
              Type <span className="font-mono text-red-600">CANCEL</span> to confirm:
            </p>
            <input
              type="text"
              value={cancelInput}
              onChange={e => setCancelInput(e.target.value)}
              placeholder="Type CANCEL"
              className="w-full mb-4"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid #D1C8F5", fontSize: 14, backgroundColor: "#fff", color: "#1A1A2E" }}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setCancelOpen(false); setCancelInput(""); }}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelInput !== "CANCEL" || canceling}
                onClick={handleCancel}
              >
                {canceling ? "Canceling..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
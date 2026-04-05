import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { DollarSign, CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
import BillReminders from "../components/payments/BillReminders";
import UtilityBillsTracker from "../components/tenant/UtilityBillsTracker";
import SavedPaymentMethods from "../components/tenant/SavedPaymentMethods";
import PaymentReceipts from "../components/tenant/PaymentReceipts";
import { Button } from "@/components/ui/button";

const isInIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export default function TenantPay() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");
  const canceled = urlParams.get("canceled");

  useEffect(() => {
    async function load() {
      const tenants = await base44.entities.Tenant.filter({ email: user?.email });
      const t = tenants[0];
      setTenant(t);
      if (t) {
        const [leases, pays] = await Promise.all([
          base44.entities.Lease.filter({ tenant_id: t.id }),
          base44.entities.Payment.filter({ tenant_id: t.id }),
        ]);
        setLease(leases.find(l => l.status === "active") || leases[0] || null);
        setPayments(pays.sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, [user, refresh]);

  const handlePay = async () => {
    if (isInIframe()) {
      alert("Online payment is only available from the published app. Please open the app directly in your browser.");
      return;
    }
    setPaying(true);
    const res = await base44.functions.invoke("createRentCheckout", {
      tenant_id: tenant?.id,
      amount: lease?.rent_amount,
      lease_id: lease?.id,
      tenant_email: user?.email,
      tenant_name: user?.full_name,
    });
    if (res.data?.url) {
      // Redirect to Stripe checkout
      setPaying(false);
      window.location.href = res.data.url;
    } else {
      alert("Could not initiate payment. Please try again.");
      setPaying(false);
    }
  };

  const handlePaymentSuccess = () => {
    setRefresh(r => r + 1);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-700">Pay Rent</h1>
        <p className="text-sm text-muted-foreground mt-1">Secure online payment powered by Stripe</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment successful!</p>
            <p className="text-sm">Your payment has been confirmed and a receipt has been sent to your email.</p>
            <Button onClick={() => window.history.replaceState({}, "", "/tenant/pay")} variant="link" className="mt-1 h-auto p-0 text-emerald-700">Dismiss</Button>
          </div>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="font-semibold">Payment canceled. No charge was made.</p>
        </div>
      )}

      {lease ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent Due</p>
              <p className="text-3xl font-outfit font-700">${lease.rent_amount?.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Lease period: {lease.start_date} — {lease.end_date}
          </div>
          <Button onClick={handlePay} disabled={paying} className="w-full gap-2 h-11">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? "Redirecting to Stripe..." : `Pay $${lease.rent_amount?.toLocaleString()} with Card`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">Secured by Stripe. You'll receive a receipt by email.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No active lease found</p>
          <p className="text-sm text-muted-foreground mt-1">Contact your property manager for assistance.</p>
        </div>
      )}

      {tenant && <PaymentReceipts tenantId={tenant.id} />}

      {payments.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Payment History</h2>
          </div>
          <div className="divide-y divide-border">
            {payments.map(p => (
              <div key={p.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">${Number(p.amount).toLocaleString()}{p.is_split && p.split_amount_2 ? ` + $${Number(p.split_amount_2).toLocaleString()} split` : ""}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.method?.replace("_"," ")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                </div>
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-muted-foreground">📅 Payment delivered: {p.date}</p>
                  {p.proof_upload_date && <p className="text-xs text-muted-foreground">🕐 Funds documented: {new Date(p.proof_upload_date).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tenant && <BillReminders tenantId={tenant.id} />}

      {tenant && <SavedPaymentMethods tenantId={tenant.id} />}

      {tenant && <UtilityBillsTracker tenantId={tenant.id} />}
    </div>
  );
}
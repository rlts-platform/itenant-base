import { CreditCard, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLAN_PRICE = { starter: 29, growth: 79, pro: 149, enterprise: 299 };
const STATUS_COLOR = { active: "default", trialing: "outline", past_due: "destructive", canceled: "secondary" };

// Generate mock invoice history based on account signup
function generateInvoices(account) {
  const invoices = [];
  const price = PLAN_PRICE[account?.plan_tier] || 29;
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

export default function BillingTab({ account }) {
  const invoices = generateInvoices(account);
  const plan = account?.plan_tier || "starter";
  const price = PLAN_PRICE[plan];

  const downloadInvoice = (inv) => {
    const content = `iTenant Invoice\n\nInvoice #: ${inv.id}\nDate: ${inv.date}\nPlan: ${plan} Plan\nAmount: $${inv.amount}.00\nStatus: ${inv.status}\n\nThank you for your business.`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${inv.id}.txt`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Current Subscription</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold capitalize">{plan} Plan</p>
              <p className="text-sm text-muted-foreground">${price}/month · billed monthly</p>
            </div>
          </div>
          <Badge variant={STATUS_COLOR[account?.subscription_status] || "secondary"}>
            {account?.subscription_status?.replace("_", " ") || "—"}
          </Badge>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Payment Method</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-muted-foreground">Expires 12/2027</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">Update</Button>
        </div>
      </div>

      {/* Invoice history */}
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
    </div>
  );
}
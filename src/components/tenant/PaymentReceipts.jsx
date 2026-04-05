import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Calendar, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentReceipts({ tenantId }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const payments = await base44.entities.Payment.filter(
          { tenant_id: tenantId, method: "stripe", status: "confirmed" },
          "-date",
          100
        );
        setReceipts(payments);
      } catch (error) {
        console.error("Error loading receipts:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId]);

  const downloadReceipt = (payment) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Inter, sans-serif; color: #1A1A2E; background: #F4F3FF; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 16px; border: 1px solid rgba(124,111,205,0.15); }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; border-bottom: 2px solid rgba(124,111,205,0.1); padding-bottom: 20px; }
          .logo { width: 40px; height: 40px; border-radius: 10px; background: #7C6FCD; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 20px; }
          .title { font-size: 20px; font-weight: 700; }
          .section { margin: 24px 0; }
          .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #7C6FCD; margin-bottom: 8px; letter-spacing: 0.07em; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(124,111,205,0.1); }
          .row-last { border-bottom: none; }
          .label { color: #6B7280; font-size: 13px; }
          .value { font-weight: 600; font-size: 14px; color: #1A1A2E; }
          .amount { font-size: 28px; font-weight: 800; color: #7C6FCD; }
          .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(124,111,205,0.1); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛡️</div>
            <div class="title">iTenant Payment Receipt</div>
          </div>

          <div class="section">
            <div class="row row-last">
              <span class="label">Payment Amount</span>
              <span class="amount">$${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="row">
              <span class="label">Date</span>
              <span class="value">${new Date(payment.date).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">Method</span>
              <span class="value">Credit Card (Stripe)</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="value" style="color: #22C55E;">✓ Confirmed</span>
            </div>
            <div class="row row-last">
              <span class="label">Transaction ID</span>
              <span class="value" style="font-family: monospace; font-size: 12px;">${payment.proof_image_url}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated receipt. No signature is required.</p>
            <p style="margin-top: 8px;">© ${new Date().getFullYear()} iTenant. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${payment.date}-${payment.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-6 text-muted-foreground text-sm">Loading receipts…</div>;
  if (receipts.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">Payment Receipts</h2>
        <span className="text-xs text-muted-foreground ml-auto">{receipts.length}</span>
      </div>
      <div className="divide-y divide-border">
        {receipts.map(receipt => (
          <div key={receipt.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-semibold">${Number(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1 ml-auto sm:ml-2">
                    <CheckCircle className="w-3 h-3" /> Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{new Date(receipt.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="font-mono text-xs">{receipt.proof_image_url}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs shrink-0"
                onClick={() => downloadReceipt(receipt)}
              >
                <Download className="w-3 h-3" /> Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
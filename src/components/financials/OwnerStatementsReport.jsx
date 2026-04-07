import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Send, Plus } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function OwnerStatementsReport({ accountId, properties, payments, workOrders }) {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Form fields
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [mgmtFeePct, setMgmtFeePct] = useState("10");
  const [priorBalance, setPriorBalance] = useState("0");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);

  const now = new Date();
  const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  useEffect(() => {
    if (!accountId) return;
    base44.entities.OwnerStatement.filter({ account_id: accountId }).then(data => {
      setStatements(data.sort((a, b) => b.statement_month?.localeCompare(a.statement_month)));
      setLoading(false);
    });
  }, [accountId]);

  const buildPreview = () => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const prop = properties.find(p => p.id === selectedProperty);

    // Income from payments in that month
    const monthPayments = payments.filter(p => p.date?.startsWith(monthKey) && (!selectedProperty || p.property_id === selectedProperty));
    const rentCollected = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const lateFees = 0;
    const otherIncome = 0;
    const totalIncome = rentCollected + lateFees + otherIncome;

    // Expenses from work orders in that month
    const monthOrders = workOrders.filter(wo =>
      wo.created_date?.startsWith(monthKey) && (!selectedProperty || wo.property_id === selectedProperty)
    );
    const repairs = monthOrders.reduce((s, wo) => s + (wo.cost || 0), 0);
    const insurance = prop?.insurance_premium || 0;
    const taxes = prop ? (prop.property_tax_annual || 0) / 12 : 0;
    const mgmtFee = Math.round(rentCollected * (Number(mgmtFeePct) / 100) * 100) / 100;
    const otherExpenses = 0;
    const totalExpenses = repairs + insurance + taxes + mgmtFee + otherExpenses;

    const noi = totalIncome - totalExpenses;
    const ownerDist = noi - mgmtFee;
    const prior = Number(priorBalance) || 0;

    setPreview({
      ownerName,
      ownerEmail,
      property: prop,
      monthKey,
      monthLabel: `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}`,
      rentCollected,
      lateFees,
      otherIncome,
      totalIncome,
      repairs,
      insurance,
      taxes,
      mgmtFee,
      mgmtFeePct: Number(mgmtFeePct),
      otherExpenses,
      totalExpenses,
      noi,
      ownerDist,
      priorBalance: prior,
      notes,
    });
    setPreviewOpen(true);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    const saved = await base44.entities.OwnerStatement.create({
      owner_name: preview.ownerName,
      owner_email: preview.ownerEmail,
      property_id: selectedProperty,
      statement_month: preview.monthKey,
      rent_collected: preview.rentCollected,
      late_fees: preview.lateFees,
      other_income: preview.otherIncome,
      repairs: preview.repairs,
      insurance: preview.insurance,
      taxes: preview.taxes,
      management_fee: preview.mgmtFee,
      management_fee_pct: preview.mgmtFeePct,
      other_expenses: preview.otherExpenses,
      net_operating_income: preview.noi,
      owner_distribution: preview.ownerDist,
      prior_balance: preview.priorBalance,
      notes: preview.notes,
      account_id: accountId,
    });
    setStatements([saved, ...statements]);
    setSaving(false);
    setPreviewOpen(false);
    setModalOpen(false);
  };

  const handleSendToOwner = async () => {
    if (!preview?.ownerEmail) {
      alert("Please enter an owner email address.");
      return;
    }
    setSending(true);
    const body = buildEmailBody(preview);
    await base44.integrations.Core.SendEmail({
      to: preview.ownerEmail,
      subject: `Owner Statement – ${preview.monthLabel} – ${preview.property?.nickname || preview.property?.address || "Property"}`,
      body,
    });
    setSending(false);
    alert("Statement emailed to owner successfully.");
  };

  const buildEmailBody = (p) => `
Owner Statement
================
Owner: ${p.ownerName}
Property: ${p.property?.address || ""}
Period: ${p.monthLabel}

INCOME
------
Rent Collected:    $${p.rentCollected.toLocaleString()}
Late Fees:         $${p.lateFees.toLocaleString()}
Other Income:      $${p.otherIncome.toLocaleString()}
Total Income:      $${p.totalIncome.toLocaleString()}

EXPENSES
--------
Repairs:           $${p.repairs.toLocaleString()}
Insurance:         $${p.insurance.toLocaleString()}
Property Taxes:    $${p.taxes.toFixed(2)}
Mgmt Fee (${p.mgmtFeePct}%): $${p.mgmtFee.toLocaleString()}
Other:             $${p.otherExpenses.toLocaleString()}
Total Expenses:    $${p.totalExpenses.toLocaleString()}

Net Operating Income:    $${p.noi.toLocaleString()}
Owner Distribution:      $${p.ownerDist.toLocaleString()}
Prior Balance:           $${p.priorBalance.toLocaleString()}

Notes: ${p.notes || "—"}
  `.trim();

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Owner Statements</h3>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Generate Owner Statement
        </Button>
      </div>

      {/* Saved Statements Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Owner</th>
              <th className="text-left px-4 py-3 font-medium">Property</th>
              <th className="text-right px-4 py-3 font-medium">Distribution</th>
              <th className="text-left px-4 py-3 font-medium">Period</th>
            </tr>
          </thead>
          <tbody>
            {statements.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No owner statements generated yet</td></tr>
            ) : (
              statements.map(s => {
                const prop = properties.find(p => p.id === s.property_id);
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 text-xs">{new Date(s.created_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{s.owner_name}</td>
                    <td className="px-4 py-3 text-xs">{prop?.nickname || prop?.address?.split(",")[0] || "—"}</td>
                    <td className="text-right px-4 py-3 font-semibold">${(s.owner_distribution || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{s.statement_month || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Statement Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Generate Owner Statement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input className="mt-1" placeholder="Owner full name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
              </div>
              <div>
                <Label>Owner Email</Label>
                <Input className="mt-1" placeholder="owner@email.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address?.split(",")[0]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Management Fee (%)</Label>
                <Input className="mt-1" type="number" value={mgmtFeePct} onChange={e => setMgmtFeePct(e.target.value)} />
              </div>
              <div>
                <Label>Prior Balance ($)</Label>
                <Input className="mt-1" type="number" value={priorBalance} onChange={e => setPriorBalance(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={buildPreview} disabled={!ownerName || !selectedProperty}>Preview Statement</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Statement Preview</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4 text-sm">
              {/* Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="font-bold text-lg">{preview.ownerName}</p>
                <p className="text-muted-foreground">{preview.property?.address}</p>
                <p className="text-muted-foreground">Period: {preview.monthLabel}</p>
              </div>

              {/* Income */}
              <div>
                <p className="font-semibold mb-2 text-emerald-700">Income</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Rent Collected</span><span className="font-semibold">${preview.rentCollected.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Late Fees</span><span>${preview.lateFees.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Other Income</span><span>${preview.otherIncome.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Total Income</span><span className="text-emerald-700">${preview.totalIncome.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <p className="font-semibold mb-2 text-red-600">Expenses</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Repairs & Maintenance</span><span>${preview.repairs.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Insurance</span><span>${preview.insurance.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Property Taxes (monthly)</span><span>${preview.taxes.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Management Fee ({preview.mgmtFeePct}%)</span><span>${preview.mgmtFee.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Other Expenses</span><span>${preview.otherExpenses.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Total Expenses</span><span className="text-red-600">${preview.totalExpenses.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between font-semibold"><span>Net Operating Income</span><span>${preview.noi.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Owner Distribution</span><span className="text-blue-700">${preview.ownerDist.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Prior Balance</span><span>${preview.priorBalance.toLocaleString()}</span></div>
              </div>

              {preview.notes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="font-semibold mb-1">Notes</p>
                  <p className="text-muted-foreground">{preview.notes}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={handleSendToOwner} disabled={sending} className="gap-2">
                  <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send to Owner"}
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Download className="w-4 h-4" /> {saving ? "Saving..." : "Save Statement"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
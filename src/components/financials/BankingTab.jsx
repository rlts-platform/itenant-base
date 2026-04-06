import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Download, Plus, Check, AlertCircle } from "lucide-react";

export default function BankingTab({ accountId, properties, tenants }) {
  const [trustAccounts, setTrustAccounts] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trustModalOpen, setTrustModalOpen] = useState(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Trust account form
  const [trustType, setTrustType] = useState("security_deposit");
  const [trustTenant, setTrustTenant] = useState("");
  const [trustOwner, setTrustOwner] = useState("");
  const [trustProperty, setTrustProperty] = useState("");
  const [trustAmount, setTrustAmount] = useState("");
  const [trustDate, setTrustDate] = useState("");
  const [trustStatus, setTrustStatus] = useState("held");

  // Reconciliation form
  const [bankBalance, setBankBalance] = useState("");
  const [bookBalance, setBookBalance] = useState("");
  const [reconciledBy, setReconciledBy] = useState("");

  // Load data
  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      base44.entities.TrustAccount.filter({ account_id: accountId }),
      base44.entities.BankReconciliation.filter({ account_id: accountId }),
    ]).then(([trust, recon]) => {
      setTrustAccounts(trust);
      setReconciliations(recon.sort((a, b) => new Date(b.reconciliation_date) - new Date(a.reconciliation_date)));
      setLoading(false);
    });
  }, [accountId]);

  // Calculate trust balance
  const trustBalance = trustAccounts.reduce((s, t) => {
    if (t.status === "held") return s + (t.amount || 0);
    return s;
  }, 0);

  // Add trust account
  const handleAddTrust = async () => {
    if (!trustAmount || !trustDate) return;
    setSaving(true);

    const newTrust = await base44.entities.TrustAccount.create({
      type: trustType,
      tenant_id: trustTenant || null,
      owner_name: trustOwner || null,
      property_id: trustProperty || null,
      amount: Number(trustAmount),
      date_received: trustDate,
      status: trustStatus,
      account_id: accountId,
    });

    setTrustAccounts([...trustAccounts, newTrust]);
    setSaving(false);
    setTrustModalOpen(false);
    setTrustAmount("");
    setTrustDate("");
    setTrustType("security_deposit");
    setTrustTenant("");
    setTrustOwner("");
    setTrustProperty("");
  };

  // Reconciliation
  const handleReconcile = async () => {
    if (!bankBalance || !bookBalance || !reconciledBy) return;
    setSaving(true);

    const bank = Number(bankBalance);
    const book = Number(bookBalance);
    const trust = trustBalance;
    const isBalanced = Math.abs(bank - book) < 0.01 && Math.abs(bank - trust) < 0.01;
    const difference = Math.abs(bank - book);

    const newRecon = await base44.entities.BankReconciliation.create({
      reconciliation_date: new Date().toISOString().split('T')[0],
      bank_balance: bank,
      book_balance: book,
      trust_balance: trust,
      status: isBalanced ? "balanced" : "discrepancy",
      difference_amount: difference,
      reconciled_by: reconciledBy,
      account_id: accountId,
    });

    setReconciliations([newRecon, ...reconciliations]);
    setSaving(false);
    setReconcileModalOpen(false);
    setBankBalance("");
    setBookBalance("");
    setReconciledBy("");
  };

  // Export trust statement
  const handleExportTrust = () => {
    const headers = ["Type", "Tenant/Owner", "Property/Unit", "Amount", "Date Received", "Status"];
    const rows = trustAccounts.map(t => [
      t.type.replace(/_/g, " "),
      t.tenant_id ? tenants.find(tn => tn.id === t.tenant_id)?.first_name + " " + tenants.find(tn => tn.id === t.tenant_id)?.last_name : t.owner_name || "",
      t.property_id ? (properties.find(p => p.id === t.property_id)?.nickname || "") : "",
      t.amount,
      t.date_received,
      t.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Trust-Account-Statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* TRUST ACCOUNTING SUBSECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: '#1A1A2E' }}>Trust Account</h2>
          <Button onClick={() => setTrustModalOpen(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Add Trust Entry
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Trust funds must never be mixed with operating funds. These are held on behalf of tenants and owners.</p>
        </div>

        {/* Trust Balance Card */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Current Trust Account Balance</p>
          <p className="text-4xl font-bold text-purple-700">${trustBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">{trustAccounts.filter(t => t.status === "held").length} held entries</p>
        </div>

        {/* Trust Account Table */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Tenant/Owner</th>
                <th className="text-left px-4 py-3 font-medium">Property/Unit</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Date Received</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {trustAccounts.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No trust account entries yet</td></tr>
              ) : (
                trustAccounts.map(t => {
                  const tenant = t.tenant_id ? tenants.find(tn => tn.id === t.tenant_id) : null;
                  const prop = t.property_id ? properties.find(p => p.id === t.property_id) : null;
                  return (
                    <tr key={t.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 text-xs font-semibold">{t.type.replace(/_/g, " ").toUpperCase()}</td>
                      <td className="px-4 py-3">{tenant ? `${tenant.first_name} ${tenant.last_name}` : t.owner_name || "—"}</td>
                      <td className="px-4 py-3 text-xs">{prop?.nickname || "—"}</td>
                      <td className="text-right px-4 py-3 font-semibold text-purple-700">${(t.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">{t.date_received || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          t.status === "held" ? "bg-blue-100 text-blue-700" :
                          t.status === "released" ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button variant="outline" className="gap-2" onClick={handleExportTrust}>
            <Download className="w-4 h-4" /> Export Trust Statement
          </Button>
        </div>
      </div>

      {/* BANK RECONCILIATION SUBSECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: '#1A1A2E' }}>Bank Reconciliation</h2>
          <Button onClick={() => setReconcileModalOpen(true)} className="gap-2" size="sm">
            Start Monthly Reconciliation
          </Button>
        </div>

        {/* Latest Reconciliation Status */}
        {reconciliations.length > 0 && (
          <div className={`rounded-xl p-6 border-2 ${
            reconciliations[0].status === "balanced"
              ? "bg-emerald-50 border-emerald-300"
              : "bg-red-50 border-red-300"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {reconciliations[0].status === "balanced" ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-900">Accounts Balanced</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-red-900">Discrepancy Found</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  As of {new Date(reconciliations[0].reconciliation_date).toLocaleDateString()}
                </p>
              </div>
              {reconciliations[0].status === "discrepancy" && (
                <div className={`text-right px-4 py-2 rounded-lg ${
                  reconciliations[0].difference_amount > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  <p className="text-sm font-semibold">Difference</p>
                  <p className="text-lg font-bold">${reconciliations[0].difference_amount.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Balance Summary */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-opacity-30" style={{
              borderColor: reconciliations[0].status === "balanced" ? "#047857" : "#dc2626"
            }}>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bank Statement</p>
                <p className="text-xl font-bold">${reconciliations[0].bank_balance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Book Balance</p>
                <p className="text-xl font-bold">${reconciliations[0].book_balance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trust Balance</p>
                <p className="text-xl font-bold">${reconciliations[0].trust_balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reconciliation History */}
        {reconciliations.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <h3 className="font-semibold text-sm">Reconciliation History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Bank Balance</th>
                  <th className="text-right px-4 py-3 font-medium">Book Balance</th>
                  <th className="text-right px-4 py-3 font-medium">Trust Balance</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {reconciliations.map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">{new Date(r.reconciliation_date).toLocaleDateString()}</td>
                    <td className="text-right px-4 py-3 font-semibold">${r.bank_balance.toLocaleString()}</td>
                    <td className="text-right px-4 py-3 font-semibold">${r.book_balance.toLocaleString()}</td>
                    <td className="text-right px-4 py-3 font-semibold">${r.trust_balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === "balanced"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.reconciled_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reconciliations.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-muted-foreground">
            <p>No reconciliations completed yet.</p>
            <p className="text-sm mt-1">Start your first monthly reconciliation to track account balances.</p>
          </div>
        )}
      </div>

      {/* Add Trust Account Modal */}
      <Dialog open={trustModalOpen} onOpenChange={setTrustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trust Account Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={trustType} onValueChange={setTrustType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                  <SelectItem value="prepaid_rent">Prepaid Rent</SelectItem>
                  <SelectItem value="owner_reserve">Owner Reserve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {trustType === "security_deposit" && (
              <div>
                <Label>Tenant</Label>
                <Select value={trustTenant} onValueChange={setTrustTenant}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {trustType === "owner_reserve" && (
              <div>
                <Label>Owner Name</Label>
                <Input
                  placeholder="Owner name"
                  value={trustOwner}
                  onChange={(e) => setTrustOwner(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Property</Label>
              <Select value={trustProperty} onValueChange={setTrustProperty}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname || p.address.split(',')[0]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={trustAmount}
                  onChange={(e) => setTrustAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={trustDate}
                  onChange={(e) => setTrustDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={trustStatus} onValueChange={setTrustStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="held">Held</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="forfeited">Forfeited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setTrustModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTrust} disabled={saving || !trustAmount || !trustDate}>
                {saving ? "Saving..." : "Add Entry"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Reconciliation Modal */}
      <Dialog open={reconcileModalOpen} onOpenChange={setReconcileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly Bank Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bank Statement Balance</Label>
              <Input
                type="number"
                placeholder="From your actual bank statement"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Book Balance</Label>
              <Input
                type="number"
                placeholder="Operating account balance"
                value={bookBalance}
                onChange={(e) => setBookBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground">Trust Account Balance</p>
              <p className="text-lg font-bold text-purple-700">${trustBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">(Auto-calculated from trust entries)</p>
            </div>
            <div>
              <Label>Reconciled By</Label>
              <Input
                placeholder="Your name"
                value={reconciledBy}
                onChange={(e) => setReconciledBy(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setReconcileModalOpen(false)}>Cancel</Button>
              <Button onClick={handleReconcile} disabled={saving || !bankBalance || !bookBalance || !reconciledBy}>
                {saving ? "Saving..." : "Save Reconciliation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
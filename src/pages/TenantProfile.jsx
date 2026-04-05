import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { User, Save, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TenantProfile() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [unit, setUnit] = useState(null);
  const [lease, setLease] = useState(null);
  const [form, setForm] = useState({ phone: "", emergency_contact_name: "", emergency_contact_phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const tenants = await base44.entities.Tenant.filter({ email: user?.email });
      const t = tenants[0];
      setTenant(t);
      if (t) {
        setForm({
          phone: t.phone || "",
          emergency_contact_name: t.emergency_contact_name || "",
          emergency_contact_phone: t.emergency_contact_phone || "",
        });
        const [units, leases] = await Promise.all([
          t.unit_id ? base44.entities.Unit.filter({ id: t.unit_id }) : Promise.resolve([]),
          base44.entities.Lease.filter({ tenant_id: t.id }),
        ]);
        setUnit(units[0] || null);
        setLease(leases.find(l => l.status === "active") || leases[0] || null);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const save = async () => {
    if (!tenant) return;
    setSaving(true);
    await base44.entities.Tenant.update(tenant.id, form);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-700">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      {/* Avatar + Name */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(user?.full_name || "T")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-semibold">{user?.full_name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="mt-1 inline-block text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full">Tenant</span>
        </div>
      </div>

      {/* Editable Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Contact Information</h2>
        <div>
          <Label>Email</Label>
          <Input className="mt-1 bg-secondary cursor-not-allowed" value={user?.email || ""} readOnly />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
        </div>
        <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" /></div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Emergency Contact</h2>
        <div><Label>Contact Name</Label><Input className="mt-1" value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} placeholder="Full name" /></div>
        <div><Label>Contact Phone</Label><Input className="mt-1" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} placeholder="(555) 000-0000" /></div>
      </div>

      {/* Read-only lease/unit info */}
      {(unit || lease) && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Rental Info</h2>
          {unit && (
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Unit</p>
                <p className="text-sm font-medium">Unit {unit.unit_number} · {unit.bedrooms}bd / {unit.bathrooms}ba · {unit.sqft} sqft</p>
              </div>
            </div>
          )}
          {lease && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Active Lease</p>
                <p className="text-sm font-medium">${lease.rent_amount?.toLocaleString()}/mo · {lease.start_date} → {lease.end_date}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Contact your property manager to make changes</p>
        </div>
      )}

      <Button onClick={save} disabled={saving} className="gap-2 w-full sm:w-auto">
        <Save className="w-4 h-4" />{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
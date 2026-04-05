import { useMemo } from "react";
import { CalendarX, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function MoveOutsTab({ tenants, leases, units, properties, onRefresh }) {
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

  const moveOuts = useMemo(() => {
    return leases
      .filter(l => l.status === "active" && l.end_date && new Date(l.end_date) <= thirtyDaysOut)
      .map(l => {
        const tenant = tenants.find(t => t.id === l.tenant_id);
        const unit = units.find(u => u.id === l.unit_id);
        const prop = unit ? properties.find(p => p.id === unit.property_id) : null;
        const endDate = new Date(l.end_date);
        const daysLeft = Math.round((endDate - now) / 86400000);
        const status = daysLeft < 0 ? "overdue" : daysLeft <= 7 ? "urgent" : "upcoming";
        return { lease: l, tenant, unit, prop, endDate, daysLeft, status };
      })
      .filter(m => m.tenant)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [tenants, leases, units, properties]);

  const sendMoveOutInstructions = async (t) => {
    if (!t.tenant?.email) return;
    await base44.integrations.Core.SendEmail({
      to: t.tenant.email,
      subject: "Move-Out Instructions",
      body: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:32px auto;">
        <h2>Move-Out Instructions</h2>
        <p>Dear ${t.tenant.first_name},</p>
        <p>Your lease ends on <strong>${t.endDate.toLocaleDateString()}</strong>. Please review the following move-out checklist:</p>
        <ul>
          <li>Clean all rooms, appliances, and fixtures</li>
          <li>Remove all personal belongings</li>
          <li>Return all keys and access cards</li>
          <li>Schedule a move-out inspection</li>
          <li>Provide forwarding address for deposit return</li>
        </ul>
        <p>Please contact us to schedule a move-out inspection.</p>
      </div>`,
    });
    alert("Move-out instructions sent to " + t.tenant.email);
  };

  const markVacant = async (t) => {
    if (t.unit) await base44.entities.Unit.update(t.unit.id, { status: "vacant" });
    await base44.entities.Lease.update(t.lease.id, { status: "expired" });
    onRefresh();
  };

  const statusConfig = {
    overdue: { color: "#EF4444", bg: "#FEF2F2", label: "Overdue" },
    urgent: { color: "#F59E0B", bg: "#FFFBEB", label: "Upcoming" },
    upcoming: { color: "#7C6FCD", bg: "#F4F3FF", label: "Upcoming" },
  };

  return (
    <div className="space-y-4">
      {moveOuts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold">No upcoming move-outs in the next 30 days</p>
        </div>
      ) : moveOuts.map(m => {
        const cfg = statusConfig[m.status];
        return (
          <div key={m.lease.id} className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold shrink-0">
              {m.tenant?.first_name?.[0]}{m.tenant?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{m.tenant?.first_name} {m.tenant?.last_name}</p>
              <p className="text-sm text-muted-foreground">
                {m.unit ? `Unit ${m.unit.unit_number}` : ""}
                {m.prop ? ` — ${m.prop.nickname || m.prop.address}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Lease ends: {m.endDate.toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 999 }} className="px-3 py-1 text-xs font-bold flex items-center gap-1">
                {m.status === "overdue" ? <AlertTriangle className="w-3 h-3"/> : <CalendarX className="w-3 h-3"/>}
                {m.daysLeft < 0 ? `${Math.abs(m.daysLeft)}d overdue` : `${m.daysLeft}d left`}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => sendMoveOutInstructions(m)}>Send Instructions</Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => markVacant(m)}>Mark Vacant</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
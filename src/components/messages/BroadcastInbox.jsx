import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Clipboard, Siren, Wrench, Calendar, DollarSign, FileText } from "lucide-react";

const BROADCAST_TYPES = {
  general_announcement: { label: "General Announcement", icon: Bell, color: "bg-blue-50 border-blue-200" },
  inspection_notice: { label: "Inspection Notice", icon: Clipboard, color: "bg-orange-50 border-orange-200" },
  emergency_alert: { label: "Emergency Alert", icon: Siren, color: "bg-red-50 border-red-200" },
  maintenance_notice: { label: "Maintenance Notice", icon: Wrench, color: "bg-yellow-50 border-yellow-200" },
  community_event: { label: "Community Event", icon: Calendar, color: "bg-green-50 border-green-200" },
  rent_reminder: { label: "Rent Reminder", icon: DollarSign, color: "bg-purple-50 border-purple-200" },
  policy_update: { label: "Policy Update", icon: FileText, color: "bg-slate-50 border-slate-200" },
};

export default function BroadcastInbox({ broadcasts, tenants }) {
  const [selected, setSelected] = useState(null);

  const getRecipientCount = (b) => {
    if (b.recipient_mode === "all_tenants") return tenants.filter(t => t.status === "active").length;
    if (b.recipient_mode === "property_specific") return b.recipient_property_ids?.length || 0;
    return b.recipient_tenant_ids?.length || 0;
  };

  const getOpenRate = (b) => {
    const count = getRecipientCount(b);
    const readCount = b.read_by?.length || 0;
    return count > 0 ? Math.round((readCount / count) * 100) : 0;
  };

  const getDeliveryBadges = (methods) => {
    const badges = [];
    if (methods?.includes("in_app")) badges.push("In-App");
    if (methods?.includes("email")) badges.push("Email");
    if (methods?.includes("sms")) badges.push("SMS");
    return badges;
  };

  const sortedBroadcasts = [...broadcasts].sort((a, b) => {
    const dateA = a.sent_at || a.scheduled_at || a.created_date;
    const dateB = b.sent_at || b.scheduled_at || b.created_date;
    return new Date(dateB) - new Date(dateA);
  });

  return (
    <>
      {sortedBroadcasts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No broadcasts sent yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBroadcasts.map(b => {
            const config = BROADCAST_TYPES[b.type];
            const Icon = config?.icon;
            return (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${config?.color}`}
              >
                <div className="flex items-start gap-3">
                  {Icon && <Icon className="w-5 h-5 shrink-0 mt-1" style={{ color: b.type === "emergency_alert" ? "#DC2626" : b.type === "inspection_notice" ? "#EA580C" : b.type === "rent_reminder" ? "#A855F7" : b.type === "community_event" ? "#16A34A" : b.type === "maintenance_notice" ? "#EAB308" : "#3B82F6" }} />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{b.subject}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.recipient_mode === "all_tenants" ? "All Tenants" : `${getRecipientCount(b)} recipients`} • {new Date(b.sent_at || b.scheduled_at || b.created_date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {getDeliveryBadges(b.delivery_methods).map(d => (
                        <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{getOpenRate(b)}%</p>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{BROADCAST_TYPES[selected.type]?.label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recipients</p>
                <p className="text-sm">{selected.recipient_mode === "all_tenants" ? "All Active Tenants" : `${getRecipientCount(selected)} selected`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Delivery Methods</p>
                <div className="flex gap-1 flex-wrap">
                  {getDeliveryBadges(selected.delivery_methods).map(d => (
                    <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Message</p>
                <div className="bg-secondary/50 rounded-lg p-3 text-sm mt-1.5 whitespace-pre-wrap">{selected.body}</div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Read Status ({selected.read_by?.length || 0}/{getRecipientCount(selected)})</p>
                <div className="bg-secondary/50 rounded-lg p-2 max-h-40 overflow-y-auto text-xs space-y-1">
                  {tenants
                    .filter(t => selected.recipient_mode === "all_tenants" ? t.status === "active" : selected.recipient_tenant_ids?.includes(t.id))
                    .map(t => (
                      <div key={t.id} className="flex items-center justify-between py-1">
                        <span>{t.first_name} {t.last_name}</span>
                        <span className={selected.read_by?.includes(t.id) ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {selected.read_by?.includes(t.id) ? "✓ Read" : "Unread"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
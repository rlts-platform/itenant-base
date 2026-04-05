import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Clipboard, Siren, Wrench, Calendar, DollarSign, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const BROADCAST_TYPES = {
  general_announcement: { label: "General Announcement", icon: Bell, color: "bg-blue-50 border-blue-200 text-blue-700" },
  inspection_notice: { label: "Inspection Notice", icon: Clipboard, color: "bg-orange-50 border-orange-200 text-orange-700" },
  emergency_alert: { label: "Emergency Alert", icon: Siren, color: "bg-red-50 border-red-200 text-red-700" },
  maintenance_notice: { label: "Maintenance Notice", icon: Wrench, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  community_event: { label: "Community Event", icon: Calendar, color: "bg-green-50 border-green-200 text-green-700" },
  rent_reminder: { label: "Rent Reminder", icon: DollarSign, color: "bg-purple-50 border-purple-200 text-purple-700" },
  policy_update: { label: "Policy Update", icon: FileText, color: "bg-slate-50 border-slate-200 text-slate-700" },
};

export default function TenantAnnouncements({ tenant, account }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readBroadcasts, setReadBroadcasts] = useState([]);

  useEffect(() => {
    if (!tenant?.id) return;
    (async () => {
      const allBroadcasts = await base44.entities.Broadcast.filter({ account_id: account?.id });
      const relevant = allBroadcasts.filter(b => {
        if (!b.sent_at) return false; // exclude scheduled
        if (b.recipient_mode === "all_tenants") return true;
        if (b.recipient_mode === "property_specific" && b.recipient_property_ids?.length > 0) return true;
        if (b.recipient_mode === "individual" && b.recipient_tenant_ids?.includes(tenant.id)) return true;
        return false;
      });
      setBroadcasts(relevant.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)));
      setLoading(false);
    })();
  }, [tenant?.id, account?.id]);

  const markAsRead = async (broadcastId) => {
    if (readBroadcasts.includes(broadcastId)) return;
    const broadcast = broadcasts.find(b => b.id === broadcastId);
    if (broadcast) {
      const updatedReadBy = [...(broadcast.read_by || []), tenant.id];
      await base44.entities.Broadcast.update(broadcastId, { read_by: updatedReadBy });
      setReadBroadcasts(prev => [...prev, broadcastId]);
    }
  };

  if (loading) return <div className="py-4 text-center text-sm text-muted-foreground">Loading announcements...</div>;
  if (broadcasts.length === 0) return <div className="py-4 text-center text-sm text-muted-foreground">No announcements yet</div>;

  const emergencyAlerts = broadcasts.filter(b => b.type === "emergency_alert" && !readBroadcasts.includes(b.id));

  return (
    <div className="space-y-4">
      {emergencyAlerts.map(alert => {
        const config = BROADCAST_TYPES[alert.type];
        const Icon = config?.icon;
        return (
          <div key={alert.id} className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
            {Icon && <Icon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-700">Emergency Alert</p>
              <p className="font-semibold text-sm mt-1">{alert.subject}</p>
              <p className="text-sm mt-2 text-red-700 whitespace-pre-wrap">{alert.body}</p>
              <Button
                onClick={() => markAsRead(alert.id)}
                size="sm"
                variant="outline"
                className="mt-2 text-xs"
              >
                Mark as Read
              </Button>
            </div>
          </div>
        );
      })}

      <div className="space-y-2">
        {broadcasts.map(b => {
          if (b.type === "emergency_alert" && !readBroadcasts.includes(b.id)) return null;
          const config = BROADCAST_TYPES[b.type];
          const Icon = config?.icon;
          const isRead = readBroadcasts.includes(b.id) || b.read_by?.includes(tenant.id);

          return (
            <div
              key={b.id}
              className={`border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${config?.color}`}
              onClick={() => !isRead && markAsRead(b.id)}
            >
              <div className="flex items-start gap-2">
                {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${isRead ? "font-normal text-muted-foreground" : "font-bold"}`}>
                      {b.subject}
                    </p>
                    {!isRead && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(b.sent_at).toLocaleDateString()}</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{b.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
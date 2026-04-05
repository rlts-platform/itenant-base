import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, CheckCircle2, Check } from "lucide-react";

function getSenderLabel(senderEmail, senderRole, fullName) {
  if (senderRole === "client") return { label: `C — ${fullName}`, color: "text-violet-600" };
  if (senderRole === "team_member") return { label: `T — ${fullName}`, color: "text-blue-600" };
  return { label: fullName.split(" ")[0], color: "text-gray-500" };
}

export default function MessageThread({ selectedRecipient, messages, properties, units, onMarkRead }) {
  const { user } = useAuth();
  const [senders, setSenders] = useState({});
  const [properties_map, setPropertiesMap] = useState({});
  const [units_map, setUnitsMap] = useState({});

  useEffect(() => {
    if (!selectedRecipient) return;

    (async () => {
      // Map properties and units
      const propsMap = {};
      const unitsMap = {};
      properties.forEach(p => propsMap[p.id] = p);
      units.forEach(u => unitsMap[u.id] = u);
      setPropertiesMap(propsMap);
      setUnitsMap(unitsMap);

      // Get sender details
      const senderData = await base44.entities.User.filter({ email: selectedRecipient });
      if (senderData.length > 0) {
        setSenders({ [selectedRecipient]: senderData[0] });
      }
    })();
  }, [selectedRecipient, properties, units]);

  const thread = messages.filter(m => m.from_user === selectedRecipient || m.to_user === selectedRecipient).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {thread.map(m => {
        const isOwn = m.from_user === user?.email;
        const sender = senders[m.from_user] || { full_name: m.from_user, role: "tenant" };
        const { label, color } = getSenderLabel(m.from_user, sender.role, sender.full_name);
        const prop = m.property_id ? properties_map[m.property_id] : null;
        const unit = m.unit_id ? units_map[m.unit_id] : null;
        const propTag = prop ? `${prop.nickname || prop.address.split(",")[0]} — Unit ${unit?.unit_number}` : "General";

        // Mark as read if viewing own sent message
        useEffect(() => {
          if (!isOwn && !m.read) {
            base44.entities.Message.update(m.id, { read: true, read_at: new Date().toISOString() });
          }
        }, [m]);

        return (
          <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[70%] space-y-1">
              {!isOwn && <p className={`text-xs font-medium ${color}`}>{label}</p>}
              {m.property_id && (
                <div className="px-2 py-1 rounded text-xs bg-primary/10 text-primary inline-block">
                  📍 {propTag}
                </div>
              )}
              {m.urgent && (
                <div className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 inline-block font-semibold">
                  🚩 Urgent
                </div>
              )}
              <div className={`px-3 py-2 rounded-xl text-sm ${isOwn ? "bg-primary text-white" : "bg-secondary"}`}>
                {m.body}
              </div>
              {m.attachments?.length > 0 && (
                <div className="mt-1 space-y-1">
                  {m.attachments.map((att, i) => (
                    <div key={i} className="text-xs">
                      {att.file_type?.startsWith("image/") ? (
                        <img src={att.file_url} alt={att.file_name} className="max-w-[120px] rounded" />
                      ) : (
                        <a href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline text-primary">
                          <FileText className="w-3 h-3" /> {att.file_name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isOwn && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  {m.read ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-primary" title={`Read at ${m.read_at ? new Date(m.read_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`} />
                      Read
                    </>
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
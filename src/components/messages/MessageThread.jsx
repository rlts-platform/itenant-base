import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FileText, CheckCircle2, Check, Download } from "lucide-react";
import AttachmentLightbox from "./AttachmentLightbox";

function getSenderLabel(senderEmail, senderRole, fullName) {
  if (senderRole === "client") return { label: `C — ${fullName}`, color: "text-violet-600" };
  if (senderRole === "team_member") return { label: `T — ${fullName}`, color: "text-blue-600" };
  return { label: fullName.split(" ")[0], color: "text-gray-500" };
}

const FILE_ICONS = {
  "application/pdf": { icon: "📄", color: "text-red-600", bg: "bg-red-50", label: "PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "📘", color: "text-blue-600", bg: "bg-blue-50", label: "DOCX" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: "📊", color: "text-green-600", bg: "bg-green-50", label: "XLSX" },
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0B";
  const k = 1024, sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i];
};

export default function MessageThread({ selectedRecipient, messages, properties, units, onMarkRead }) {
  const { user } = useAuth();
  const [senders, setSenders] = useState({});
  const [properties_map, setPropertiesMap] = useState({});
  const [units_map, setUnitsMap] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(null);

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
              {m.attachments?.length > 0 && (() => {
                const images = m.attachments.filter(a => a.file_type?.startsWith("image/"));
                const docs = m.attachments.filter(a => !a.file_type?.startsWith("image/"));
                return (
                  <div className="mt-2 space-y-2">
                    {/* Image Grid */}
                    {images.length > 0 && (
                      <div className={`grid gap-1 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                        {images.map((img, i) => (
                          <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxOpen({ images, index: i })}>
                            <img src={img.file_url} alt={img.file_name} className="w-full h-32 object-cover rounded-lg" />
                            {images.length > 4 && i === 3 && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Document Cards */}
                    {docs.length > 0 && (
                      <div className="space-y-1">
                        {docs.map((doc, i) => {
                          const config = FILE_ICONS[doc.file_type] || { icon: "📎", color: "text-gray-600", bg: "bg-gray-50", label: "FILE" };
                          return (
                            <div key={i} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${config.bg} text-sm`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-lg shrink-0">{config.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" className={`${config.color} underline truncate block hover:no-underline`}>
                                    {doc.file_name}
                                  </a>
                                  <p className="text-xs text-gray-500">{formatFileSize(doc.file_size || 0)}</p>
                                </div>
                              </div>
                              <a href={doc.file_url} download={doc.file_name} className={`${config.color} shrink-0`} title="Download">
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
              {lightboxOpen?.images && <AttachmentLightbox images={lightboxOpen.images} initialIndex={lightboxOpen.index} onClose={() => setLightboxOpen(null)} />}
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
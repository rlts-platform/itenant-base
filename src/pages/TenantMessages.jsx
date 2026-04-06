import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageSquare, Send, Paperclip, Flag, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TenantAnnouncements from "../components/tenant/TenantAnnouncements";
import AttachmentPreviewStrip from "../components/messages/AttachmentPreviewStrip";
import AttachmentLightbox from "../components/messages/AttachmentLightbox";

export default function TenantMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState("announcements"); // announcements or messages
  const bottomRef = useRef(null);

  const load = async () => {
    const tenants = await base44.entities.Tenant.filter({ email: user?.email });
    const t = tenants[0];
    setTenant(t);
    if (t) {
      const accounts = await base44.entities.Account.filter({ id: t.account_id });
      setAccount(accounts[0]);
    }
    const sent = await base44.entities.Message.filter({ from_user: user?.email });
    const received = await base44.entities.Message.filter({ to_user: user?.email });
    const all = [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(all);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => { load(); }, [user]);

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const SUPPORTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

  const validateAndAddFiles = async (files) => {
    const newErrors = { ...errors };
    const newAttachments = [...attachments];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = newAttachments.length + i;

      if (file.size > 10 * 1024 * 1024) {
        newErrors[fileIndex] = "File too large — maximum 10MB per file.";
        continue;
      }

      if (!SUPPORTED_TYPES.includes(file.type)) {
        newErrors[fileIndex] = "File type not supported. Use PDF, JPG, PNG, DOCX, or XLSX.";
        continue;
      }

      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        newAttachments.push({ file_url, file_name: file.name, file_type: file.type, file_size: file.size, preview });
        delete newErrors[fileIndex];
      } catch (err) {
        newErrors[fileIndex] = "Upload failed";
      }
    }

    setAttachments(newAttachments);
    setErrors(newErrors);
  };

  const handleAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    await validateAndAddFiles(files);
    e.target.value = "";
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    await validateAndAddFiles(files);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const send = async () => {
    if (!newMsg.trim() && attachments.length === 0) return;
    setSending(true);
    const tenants = await base44.entities.Tenant.filter({ email: user?.email });
    const tenant = tenants[0];
    const toUser = tenant?.account_id || "landlord";
    const cleanAttachments = attachments.map(({ preview, ...rest }) => rest);

    await base44.entities.Message.create({
      body: newMsg.trim(),
      from_user: user?.email,
      to_user: toUser,
      read: false,
      attachments: cleanAttachments,
      account_id: tenant?.account_id,
    });
    setNewMsg("");
    setAttachments([]);
    setErrors({});
    setSending(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-outfit font-700">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Communicate with your property manager</p>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "announcements" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === "messages" ? "bg-white shadow" : "hover:bg-white/50"
          }`}
        >
          Direct Messages
        </button>
      </div>

      {activeTab === "announcements" && (
        <div className="bg-card border border-border rounded-xl p-4">
          <TenantAnnouncements tenant={tenant} account={account} />
        </div>
      )}

      {activeTab === "messages" && (
      <div className="bg-card border border-border rounded-xl flex flex-col" style={{ height: "60vh" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-semibold">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">Send a message to your landlord</p>
            </div>
          ) : (
            messages.map(m => {
              const isMe = m.from_user === user?.email;
              const images = m.attachments?.filter(a => a.file_type?.startsWith("image/")) || [];
              const docs = m.attachments?.filter(a => !a.file_type?.startsWith("image/")) || [];
              const FILE_ICONS = {
                "application/pdf": { icon: "📄", color: "text-red-600", bg: "bg-red-50" },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "📘", color: "text-blue-600", bg: "bg-blue-50" },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: "📊", color: "text-green-600", bg: "bg-green-50" },
              };
              const formatFileSize = (bytes) => {
                if (bytes === 0) return "0B";
                const k = 1024, sizes = ["B", "KB", "MB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i];
              };

              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] space-y-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white" : "bg-secondary text-foreground"}`}>
                      <p>{m.body}</p>
                    </div>
                    {/* Images */}
                    {images.length > 0 && (
                      <div className={`grid gap-1 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                        {images.map((img, i) => (
                          <div key={i} className="relative cursor-pointer" onClick={() => setLightboxOpen({ images, index: i })}>
                            <img src={img.file_url} alt={img.file_name} className="w-full h-32 object-cover rounded-lg" />
                            {images.length > 4 && i === 3 && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">+{images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Docs */}
                    {docs.length > 0 && (
                      <div className="space-y-1">
                        {docs.map((doc, i) => {
                          const config = FILE_ICONS[doc.file_type] || { icon: "📎", color: "text-gray-600", bg: "bg-gray-50" };
                          return (
                            <div key={i} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${config.bg} text-sm`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-lg">{config.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" className={`${config.color} underline truncate block`}>
                                    {doc.file_name}
                                  </a>
                                  <p className="text-xs text-gray-500">{formatFileSize(doc.file_size || 0)}</p>
                                </div>
                              </div>
                              <a href={doc.file_url} download={doc.file_name} className={config.color}>
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isMe ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {lightboxOpen?.images && <AttachmentLightbox images={lightboxOpen.images} initialIndex={lightboxOpen.index} onClose={() => setLightboxOpen(null)} />}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border space-y-2" ref={dropZoneRef} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
          {dragActive && (
            <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
              <p className="text-purple-600 font-medium">Drop files to attach</p>
            </div>
          )}
          <div className="p-3 space-y-2">
            {attachments.length > 0 && <AttachmentPreviewStrip attachments={attachments} onRemove={removeAttachment} errors={errors} />}
            <div className="flex gap-2">
              <Input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl"
              />
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.png,.docx,.xlsx" onChange={handleAttach} className="hidden" />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Attach files">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button onClick={send} disabled={sending || (!newMsg.trim() && attachments.length === 0)} size="icon" className="rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
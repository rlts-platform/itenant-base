import { useState } from "react";
import { Send, Paperclip, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function MessageInput({ onSend, propertyId, unitId, selectedRecipient }) {
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [urgent, setUrgent] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

    setUploading(true);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit`);
        continue;
      }
      if (!validTypes.includes(file.type)) {
        alert(`File type not allowed: ${file.name}`);
        continue;
      }

      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { file_url, file_name: file.name, file_type: file.type }]);
      } catch (err) {
        alert(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSend = () => {
    if (!body.trim() || !propertyId || !unitId || !selectedRecipient) return;
    onSend({ body, attachments, urgent });
    setBody("");
    setAttachments([]);
    setUrgent(false);
  };

  return (
    <div className="p-3 border-t border-border space-y-2">
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              {att.file_name}
              <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} />
        <label>
          <input type="file" multiple accept=".pdf,.jpg,.png,.docx,.xlsx" onChange={handleAttach} className="hidden" disabled={uploading} />
          <Button variant="outline" size="icon" asChild className="cursor-pointer">
            <Paperclip className="w-4 h-4" />
          </Button>
        </label>
        <Button variant="outline" size="icon" onClick={() => setUrgent(!urgent)} className={urgent ? "bg-red-50 text-red-600 border-red-200" : ""}>
          <Flag className="w-4 h-4" />
        </Button>
        <Button onClick={handleSend} size="icon" disabled={uploading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
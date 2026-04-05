import { X, FileText, AlertCircle } from "lucide-react";

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

export default function AttachmentPreviewStrip({ attachments, onRemove, errors = {} }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {attachments.map((att, i) => {
        const isImage = att.file_type?.startsWith("image/");
        const config = FILE_ICONS[att.file_type] || { icon: "📎", color: "text-gray-600", bg: "bg-gray-50" };
        const error = errors[i];

        return (
          <div key={i} className="space-y-1">
            <div className={`relative w-20 h-20 rounded-lg overflow-hidden border border-border ${isImage ? "bg-gray-100" : config.bg}`}>
              {isImage ? (
                <img src={att.preview} alt={att.file_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-xs text-center px-1 font-medium truncate">{att.file_name?.split(".").pop()?.toUpperCase()}</span>
                </div>
              )}
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate max-w-20">{att.file_name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
          </div>
        );
      })}
    </div>
  );
}
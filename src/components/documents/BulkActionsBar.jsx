import { Button } from "@/components/ui/button";
import { Download, Mail, FolderOpen, Share2, X } from "lucide-react";

export default function BulkActionsBar({ selectedCount, onZipDownload, onEmailShare, onMoveFolder, onShare, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-4 flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={onZipDownload}
        >
          <Download className="w-3.5 h-3.5" /> ZIP
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={onEmailShare}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={onMoveFolder}
        >
          <FolderOpen className="w-3.5 h-3.5" /> Move
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={onShare}
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-primary-foreground hover:bg-primary/80"
          onClick={onClear}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
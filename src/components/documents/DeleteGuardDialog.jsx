import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";

export default function DeleteGuardDialog({ doc, onConfirm, onCancel }) {
  if (!doc) return null;

  const handleDownload = () => {
    if (doc.file_url) {
      const a = document.createElement("a");
      a.href = doc.file_url;
      a.target = "_blank";
      a.download = doc.file_name;
      a.click();
    } else if (doc.body_text) {
      const blob = new Blob([doc.body_text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name + ".txt";
      a.click();
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Export Before Deleting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You must export this document before deleting it. Once deleted, it cannot be recovered.
          </p>
          <div className="bg-secondary/40 rounded-lg p-3">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
          </div>
          <p className="text-sm font-medium">Download now?</p>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            Delete Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { downloadCSV, generateCSV, getDateForFilename } from "@/lib/csvExport";

export default function ExportButton({ onExport, pageName, hasFilters = false, isLoading = false }) {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (exportAll = false) => {
    setExporting(true);
    try {
      const { headers, rows } = await onExport(exportAll);
      const csv = generateCSV(headers, rows);
      const filename = `iTenant_${pageName}_${getDateForFilename()}.csv`;
      downloadCSV(csv, filename);
      toast.success(`Your CSV has been downloaded — ${filename}`, { icon: "✓" });
      setShowFilterDialog(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleClick = () => {
    if (hasFilters) {
      setShowFilterDialog(true);
    } else {
      handleExport(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={exporting}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export CSV</span>
      </Button>

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>Do you want to export filtered results only or all records?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleExport(true)} disabled={exporting}>
              {exporting ? "Exporting..." : "Export All Records"}
            </Button>
            <Button onClick={() => handleExport(false)} disabled={exporting}>
              {exporting ? "Exporting..." : "Export Filtered Results"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
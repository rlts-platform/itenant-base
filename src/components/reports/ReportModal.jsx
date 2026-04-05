import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Sparkles, X } from "lucide-react";
import jsPDF from "jspdf";

export default function ReportModal({ report, onClose }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (!report) return null;
  const { title, columns, rows, note } = report;

  const exportCSV = () => {
    const header = columns.join(",");
    const body = rows.map(r => columns.map(c => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, "_")}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: rows.length > 0 && columns.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

    const colWidth = Math.min(40, (doc.internal.pageSize.getWidth() - 28) / columns.length);
    let y = 34;

    // Header row
    doc.setFillColor(240, 240, 250);
    doc.rect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 8, "F");
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    columns.forEach((c, i) => doc.text(String(c).substring(0, 18), 14 + i * colWidth, y));
    doc.setFont(undefined, "normal");
    y += 8;

    rows.forEach((r, ri) => {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      if (ri % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 7, "F");
      }
      columns.forEach((c, i) => {
        const val = String(r[c] ?? "").substring(0, 20);
        doc.text(val, 14 + i * colWidth, y);
      });
      y += 7;
    });

    if (aiSummary) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("AI Summary", 14, 20);
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(aiSummary, doc.internal.pageSize.getWidth() - 28);
      doc.text(lines, 14, 30);
    }

    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  const generateAISummary = async () => {
    setLoadingAI(true);
    const prompt = `You are a property management expert. Analyze the following "${title}" report data and provide a 3-5 sentence plain-English summary of key findings, trends, and 2-3 specific action items the landlord should consider.

Report data (${rows.length} rows):
${JSON.stringify(rows.slice(0, 50), null, 2)}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiSummary(result);
    setLoadingAI(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={generateAISummary} disabled={loadingAI} className="gap-1.5">
                {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                AI Summary
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                <FileText className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button size="sm" onClick={exportPDF} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          </div>
          {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {aiSummary && (
            <div className="mx-6 mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm leading-relaxed relative">
              <div className="flex items-center gap-1.5 text-primary font-semibold text-xs mb-2">
                <Sparkles className="w-3.5 h-3.5" /> AI Summary
              </div>
              {aiSummary}
              <button onClick={() => setAiSummary(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="px-6 py-4 overflow-x-auto">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No data available for this report.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/60">
                    {columns.map(c => (
                      <th key={c} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap border-b border-border">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                      {columns.map(c => (
                        <td key={c} className="px-3 py-2.5 border-b border-border/50 whitespace-nowrap text-sm">{r[c] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
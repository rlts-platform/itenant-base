import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { History } from "lucide-react";

export default function ActivityLogHistory({ recordId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) return;
    base44.entities.ActivityLog.filter({ record_id: recordId }).then(data => {
      setLogs(data.sort((a, b) => a.changed_at?.localeCompare(b.changed_at)));
      setLoading(false);
    });
  }, [recordId]);

  if (loading) return <div className="text-xs text-muted-foreground py-2">Loading history…</div>;
  if (logs.length === 0) return <div className="text-xs text-muted-foreground py-2 italic">No status changes recorded yet.</div>;

  return (
    <div className="space-y-1.5">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
          <span className="text-muted-foreground">
            {new Date(log.changed_at).toLocaleString()} — <span className="font-medium text-foreground">{log.changed_by}</span> changed status
            {log.old_status ? <> from <span className="font-medium">{log.old_status}</span></> : ""} to <span className="font-medium">{log.new_status}</span>
            {log.notes ? <span className="text-muted-foreground"> · {log.notes}</span> : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
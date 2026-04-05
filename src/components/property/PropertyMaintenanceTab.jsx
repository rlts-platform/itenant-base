import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColor = { new: "outline", in_progress: "secondary", closed: "default" };
const CATEGORIES = ["all","plumbing","electrical","hvac","appliance","pest","structural","other"];

export default function PropertyMaintenanceTab({ orders }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = orders.filter(o => {
    const d = new Date(o.created_date);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate)) return false;
    if (category !== "all" && o.category !== category) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" className="mt-1 w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" className="mt-1 w-36" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center text-muted-foreground">No maintenance records match the filter.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs">
              <tr>{["Date","Issue","Category","Cost","Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(o.created_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{o.summary}</td>
                  <td className="px-4 py-3 capitalize">{o.category}</td>
                  <td className="px-4 py-3">{o.cost ? `$${o.cost.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor[o.status] || "secondary"}>{o.status?.replace("_"," ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
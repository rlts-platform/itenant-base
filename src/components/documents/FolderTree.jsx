import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const FOLDER_TREE = [
  { id: "leases", label: "Leases", children: [
    { id: "active_lease", label: "Active Leases" },
    { id: "lease_renewal", label: "Lease Renewals" },
    { id: "expired_lease", label: "Expired Leases" },
  ]},
  { id: "legal", label: "Legal & Notices", children: [
    { id: "eviction_notice", label: "Eviction Notices" },
    { id: "lease_violation", label: "Lease Violations" },
    { id: "move_notice", label: "Move-In/Move-Out Notices" },
  ]},
  { id: "financial", label: "Financial Records", children: [
    { id: "rent_receipt", label: "Rent Receipts" },
    { id: "invoice", label: "Invoices" },
    { id: "bank_statement", label: "Bank Statements" },
    { id: "tax_document", label: "Tax Documents" },
  ]},
  { id: "property", label: "Property Records", children: [
    { id: "inspection", label: "Inspections" },
    { id: "permit", label: "Permits" },
    { id: "insurance", label: "Insurance" },
    { id: "deed", label: "Deeds" },
  ]},
  { id: "maintenance", label: "Maintenance Records", children: [
    { id: "work_order", label: "Work Orders" },
    { id: "repair_receipt", label: "Repair Receipts" },
    { id: "vendor_invoice", label: "Vendor Invoices" },
  ]},
  { id: "applications", label: "Applications", children: [
    { id: "application_pending", label: "Pending" },
    { id: "application_approved", label: "Approved" },
    { id: "application_denied", label: "Denied" },
  ]},
  { id: "other", label: "Other", children: [] },
];

// flat map of all leaf/parent ids → label
export const ALL_FOLDER_IDS = FOLDER_TREE.flatMap(f => [f.id, ...(f.children?.map(c => c.id) || [])]);

export const SUBCATEGORY_LABELS = Object.fromEntries(
  FOLDER_TREE.flatMap(f => [[f.id, f.label], ...(f.children?.map(c => [c.id, c.label]) || [])])
);

function FolderNode({ node, selected, onSelect, counts }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children?.length > 0;
  const isSelected = selected === node.id;
  const totalCount = hasChildren
    ? node.children.reduce((s, c) => s + (counts[c.id] || 0), 0) + (counts[node.id] || 0)
    : (counts[node.id] || 0);

  return (
    <div>
      <button
        onClick={() => { hasChildren ? setOpen(o => !o) : null; onSelect(node.id); }}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary/60 text-foreground"
        )}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        ) : <span className="w-3.5" />}
        {isSelected ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <span className="flex-1 truncate">{node.label}</span>
        {totalCount > 0 && <span className="text-xs text-muted-foreground">{totalCount}</span>}
      </button>
      {hasChildren && open && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {node.children.map(c => (
            <FolderNode key={c.id} node={c} selected={selected} onSelect={onSelect} counts={counts} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ selected, onSelect, docs }) {
  const counts = {};
  docs.forEach(d => {
    const key = d.subcategory || "other";
    counts[key] = (counts[key] || 0) + 1;
  });

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left mb-1",
          !selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary/60"
        )}
      >
        <FolderOpen className="w-4 h-4 shrink-0" />
        <span className="flex-1">All Documents</span>
        <span className="text-xs text-muted-foreground">{docs.length}</span>
      </button>
      {FOLDER_TREE.map(f => (
        <FolderNode key={f.id} node={f} selected={selected} onSelect={onSelect} counts={counts} />
      ))}
    </div>
  );
}
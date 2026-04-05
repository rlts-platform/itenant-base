import { Droplet, Zap, Wind, Wrench, Bug, AlertCircle, Clock, MoreVertical, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CATEGORY_ICONS = {
  plumbing: { icon: Droplet, color: "text-blue-600" },
  electrical: { icon: Zap, color: "text-yellow-600" },
  hvac: { icon: Wind, color: "text-cyan-600" },
  appliance: { icon: Wrench, color: "text-gray-600" },
  pest: { icon: Bug, color: "text-red-600" },
  structural: { icon: AlertCircle, color: "text-purple-600" },
  other: { icon: Wrench, color: "text-gray-600" },
};

const URGENCY_CONFIG = {
  normal: { badge: "Normal", color: "bg-blue-100 text-blue-700", border: "" },
  urgent: { badge: "Urgent", color: "bg-orange-100 text-orange-700", border: "" },
  emergency: { badge: "Emergency", color: "bg-red-100 text-red-700", border: "border-2 border-red-500 animate-pulse" },
};

export default function KanbanCard({ workOrder, onOpenMenu, onQuickAction, tenants, vendors, properties, units, isDragging }) {
  const [showMenu, setShowMenu] = useState(false);
  const urgencyConfig = URGENCY_CONFIG[workOrder.urgency] || URGENCY_CONFIG.normal;
  const categoryConfig = CATEGORY_ICONS[workOrder.category] || CATEGORY_ICONS.other;
  const CategoryIcon = categoryConfig.icon;

  const tenant = tenants.find(t => t.id === workOrder.tenant_id);
  const vendor = vendors.find(v => v.id === workOrder.assigned_vendor_id);
  const unit = units.find(u => u.id === workOrder.unit_id);
  const property = properties.find(p => p.id === workOrder.property_id);

  const daysAgo = Math.floor((Date.now() - new Date(workOrder.created_date).getTime()) / (1000 * 60 * 60 * 24));

  const urgencyActions = [
    { label: "View Details", action: "view" },
    { label: "Assign Vendor", action: "assign" },
    { label: "Schedule Repair", action: "schedule" },
    ...(workOrder.urgency !== "emergency" ? [{ label: "Mark Urgent", action: "urgent" }] : []),
    { label: "Add Note", action: "note" },
    { label: "Send Update to Tenant", action: "message" },
  ];

  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border cursor-move transition-all ${urgencyConfig.border} ${isDragging ? "opacity-50" : ""}`}
      draggable
      onDragStart={(e) => e.dataTransfer.effectAllowed = "move"}
    >
      {/* Header: Urgency + Category */}
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded ${urgencyConfig.color}`}>
          {urgencyConfig.badge}
        </span>
        <CategoryIcon className={`w-4 h-4 ${categoryConfig.color}`} />
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm text-gray-900 mb-1">{workOrder.summary}</h4>

      {/* Property & Unit */}
      <p className="text-xs text-gray-600 mb-0.5">
        📍 {property?.address || "—"} • Unit {unit?.unit_number || "—"}
      </p>

      {/* Tenant */}
      <p className="text-xs text-gray-600 mb-2">
        {tenant?.first_name} {tenant?.last_name}
      </p>

      {/* Vendor */}
      <div className="mb-2">
        {vendor ? (
          <p className="text-xs text-gray-700">
            <strong>Vendor:</strong> {vendor.name}
          </p>
        ) : (
          <p className="text-xs text-amber-600 font-medium">Unassigned</p>
        )}
      </div>

      {/* Scheduled Date */}
      {workOrder.scheduled_date ? (
        <p className="text-xs text-gray-700 mb-2">
          <strong>Scheduled:</strong> {new Date(workOrder.scheduled_date).toLocaleDateString()} {workOrder.time_window || ""}
        </p>
      ) : (
        <p className="text-xs text-gray-500 mb-2">No date set</p>
      )}

      {/* Bottom: Days + Menu */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
        </span>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-10 min-w-[160px]">
              {urgencyActions.map((act) => (
                <button
                  key={act.action}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction(workOrder.id, act.action);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
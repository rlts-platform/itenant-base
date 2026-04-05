import { Plus } from "lucide-react";
import { useState, useRef } from "react";
import KanbanCard from "./KanbanCard";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", badge: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700", badge: "bg-amber-500" },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-700", badge: "bg-purple-500" },
  closed: { label: "Completed", color: "bg-green-100 text-green-700", badge: "bg-green-500" },
};

export default function KanbanColumn({
  status,
  workOrders,
  onDrop,
  onAddClick,
  onQuickAction,
  tenants,
  vendors,
  properties,
  units,
  isDragOver,
  onDragOver,
  onDragLeave,
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const containerRef = useRef(null);

  const totalCost = workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0);
  const count = workOrders.length;

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const workOrderId = e.dataTransfer.getData("text/plain");
    onDrop(workOrderId, status);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-white rounded-lg border-2 transition-all ${
        isDragOver ? "border-purple-400 bg-purple-50" : "border-gray-200"
      } w-80 shrink-0`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${config.badge}`} />
          <h3 className="font-bold text-gray-900">{config.label}</h3>
          <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full text-white ${config.badge}`}>
            {count}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Estimated: ${totalCost.toLocaleString()}
        </p>
      </div>

      {/* Cards Container — Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 max-h-[600px]">
        {workOrders.map((wo) => (
          <div key={wo.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", wo.id)}>
            <KanbanCard
              workOrder={wo}
              onQuickAction={onQuickAction}
              tenants={tenants}
              vendors={vendors}
              properties={properties}
              units={units}
            />
          </div>
        ))}
      </div>

      {/* Footer: Add Button + Total */}
      <div className="border-t border-gray-200 px-3 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddClick(status)}
          className="w-full gap-2 mb-2"
        >
          <Plus className="w-4 h-4" />
          Add Work Order
        </Button>
        <p className="text-xs text-gray-500 text-center">
          {count} work order{count !== 1 ? "s" : ""} — ${totalCost.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
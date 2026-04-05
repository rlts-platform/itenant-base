import { useState } from "react";
import { base44 } from "@/api/base44Client";
import KanbanColumn from "./KanbanColumn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["new", "in_progress", "scheduled", "closed"];

export default function KanbanBoard({
  workOrders,
  tenants,
  vendors,
  properties,
  units,
  filters,
  onWorkOrdersChange,
  onOpenForm,
}) {
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [completionDialog, setCompletionDialog] = useState(null);
  const [vendorAssignDialog, setVendorAssignDialog] = useState(null);

  // Filter work orders
  const filteredOrders = workOrders.filter((wo) => {
    if (filters.property && wo.property_id !== filters.property) return false;
    if (filters.urgency && wo.urgency !== filters.urgency) return false;
    if (filters.dateRange) {
      const woDate = new Date(wo.created_date);
      if (woDate < filters.dateRange.start || woDate > filters.dateRange.end) return false;
    }
    return true;
  });

  const ordersByStatus = {};
  STATUSES.forEach((status) => {
    ordersByStatus[status] = filteredOrders.filter((wo) => wo.status === status);
  });

  const handleDrop = async (workOrderId, newStatus) => {
    const workOrder = workOrders.find((wo) => wo.id === workOrderId);
    if (!workOrder) return;

    // If dropping to Completed, show confirmation dialog
    if (newStatus === "closed") {
      setCompletionDialog({ workOrderId, newStatus });
    } else if (newStatus === "in_progress" && workOrder.status === "new" && !workOrder.assigned_vendor_id) {
      // If moving from New to In Progress without vendor, prompt to assign
      setVendorAssignDialog({ workOrderId, newStatus });
    } else {
      // Update status in database
      await base44.entities.WorkOrder.update(workOrderId, { status: newStatus });
      onWorkOrdersChange();
    }
  };

  const handleCompleteWork = async (resolutionNotes) => {
    if (completionDialog) {
      await base44.entities.WorkOrder.update(completionDialog.workOrderId, {
        status: "closed",
        notes: resolutionNotes,
      });
      setCompletionDialog(null);
      onWorkOrdersChange();
    }
  };

  const handleAssignVendor = async (vendorId) => {
    if (vendorAssignDialog && vendorId) {
      await base44.entities.WorkOrder.update(vendorAssignDialog.workOrderId, {
        status: vendorAssignDialog.newStatus,
        assigned_vendor_id: vendorId,
      });
      setVendorAssignDialog(null);
      onWorkOrdersChange();
    }
  };

  const handleQuickAction = (workOrderId, action) => {
    const wo = workOrders.find((w) => w.id === workOrderId);
    if (!wo) return;

    switch (action) {
      case "view":
        // Opens detail view (handled by parent)
        break;
      case "urgent":
        base44.entities.WorkOrder.update(workOrderId, { urgency: "emergency" });
        onWorkOrdersChange();
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            workOrders={ordersByStatus[status]}
            onDrop={handleDrop}
            onAddClick={(s) => onOpenForm(s)}
            onQuickAction={handleQuickAction}
            tenants={tenants}
            vendors={vendors}
            properties={properties}
            units={units}
            isDragOver={dragOverStatus === status}
            onDragOver={() => setDragOverStatus(status)}
            onDragLeave={() => setDragOverStatus(null)}
          />
        ))}
      </div>

      {/* Completion Dialog */}
      {completionDialog && (
        <Dialog open={!!completionDialog} onOpenChange={() => setCompletionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Work Order as Completed?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resolution Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any resolution notes..."
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCompletionDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const notes = document.getElementById("notes")?.value || "";
                    handleCompleteWork(notes);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Vendor Assignment Dialog */}
      {vendorAssignDialog && (
        <Dialog open={!!vendorAssignDialog} onOpenChange={() => setVendorAssignDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign a Vendor?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Vendor</Label>
                <Select onValueChange={async (vendorId) => {
                  await handleAssignVendor(vendorId);
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  // Skip vendor assignment, just update status
                  if (vendorAssignDialog) {
                    base44.entities.WorkOrder.update(vendorAssignDialog.workOrderId, {
                      status: vendorAssignDialog.newStatus,
                    });
                    setVendorAssignDialog(null);
                  }
                }}
                className="w-full"
              >
                Skip for Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
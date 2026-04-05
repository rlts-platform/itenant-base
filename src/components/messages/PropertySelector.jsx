import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PropertySelector({ open, onClose, onSelect }) {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [props, us] = await Promise.all([
        base44.entities.Property.list(),
        base44.entities.Unit.list(),
      ]);
      setProperties(props);
      setUnits(us);
      setSelectedProp("");
      setSelectedUnit("");
    })();
  }, [open]);

  const filteredUnits = selectedProp
    ? units.filter(u => u.property_id === selectedProp)
    : [];

  const handleSubmit = () => {
    if (selectedProp && selectedUnit) {
      onSelect(selectedProp, selectedUnit);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Message to Property & Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Property</label>
            <Select value={selectedProp} onValueChange={setSelectedProp}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nickname || p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Unit</label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedProp}>
              <SelectTrigger>
                <SelectValue placeholder={selectedProp ? "Select unit" : "Select property first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredUnits.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    Unit {u.unit_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!selectedProp || !selectedUnit}>
              Link & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
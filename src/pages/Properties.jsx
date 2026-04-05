import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Building2, MapPin, Pencil, Trash2, ChevronRight, Link2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ExportButton from "../components/ExportButton";
import { formatCurrency } from "@/lib/csvExport";
import PropertyProfile from "./PropertyProfile";
import AddPropertyWizard from "../components/property/AddPropertyWizard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  if (selectedId) return <PropertyProfile propertyId={selectedId} onBack={() => setSelectedId(null)} />;

  const load = async () => {
    const [data, u, wo] = await Promise.all([base44.entities.Property.list("-created_date"), base44.entities.Unit.list(), base44.entities.WorkOrder.list()]);
    setProperties(data);
    setUnits(u);
    setWorkOrders(wo);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (location.state?.openAdd) { setWizardOpen(true); window.history.replaceState({}, ""); } }, [location.state]);

  const remove = async (id) => { await base44.entities.Property.delete(id); load(); };
  const handleSaved = (propertyId) => { load(); setSelectedId(propertyId); };

  const exportProperties = async (exportAll) => {
    const rows = properties.map(p => {
      const propUnits = units.filter(u => u.property_id === p.id);
      const occupied = propUnits.filter(u => u.status === "occupied").length;
      const vacant = propUnits.filter(u => u.status === "vacant").length;
      const totalRent = propUnits.reduce((sum, u) => sum + (u.rent_amount || 0), 0);
      const openOrders = workOrders.filter(wo => wo.property_id === p.id && wo.status !== "closed").length;
      return {
        "Property Nickname": p.nickname || "",
        "Full Address": p.address,
        "Property Type": p.type || "",
        "Year Built": p.year_built || "",
        "Total Units": propUnits.length,
        "Occupied Units": occupied,
        "Vacant Units": vacant,
        "Total Monthly Rent": formatCurrency(totalRent),
        "Open Work Orders": openOrders,
        "Insurance Provider": p.insurance_provider || "",
        "Insurance Premium": formatCurrency(p.insurance_premium),
        "HOA Name": p.hoa_name || "",
        "HOA Monthly Fee": formatCurrency(p.hoa_monthly_fee)
      };
    });
    return {
      headers: ["Property Nickname", "Full Address", "Property Type", "Year Built", "Total Units", "Occupied Units", "Vacant Units", "Total Monthly Rent", "Open Work Orders", "Insurance Provider", "Insurance Premium", "HOA Name", "HOA Monthly Fee"],
      rows
    };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-800 text-foreground">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your rental properties</p>
        </div>
        <div className="flex gap-2">
          {properties.length > 0 && <ExportButton pageName="Properties" onExport={exportProperties} />}
          <Button onClick={() => setWizardOpen(true)} className="gap-2 rounded-xl shadow-sm">
            <Plus className="w-4 h-4" />Add Property
          </Button>
        </div>
      </motion.div>

      {properties.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-border rounded-2xl p-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No properties yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first property to get started</p>
          <Button onClick={() => setWizardOpen(true)} className="mt-4 gap-2 rounded-xl"><Plus className="w-4 h-4" />Add Property</Button>
        </motion.div>
      ) : (
        <motion.div className="space-y-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
          <AnimatePresence>
            {properties.map(p => (
              <motion.div
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                className="bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground leading-tight">{p.nickname || p.address}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-sm">{p.address}</span>
                    </div>
                    {p.type && <span className="mt-2 inline-block text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full capitalize">{p.type.replace(/_/g, " ")}</span>}
      <div className="flex gap-2 mt-3">
                      <button onClick={() => setSelectedId(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                        View Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply/${p.id}`); alert("Application link copied!"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Copy Link
                      </button>
                      <button onClick={() => remove(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-destructive hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AddPropertyWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={handleSaved} />
    </div>
  );
}
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Upload, Loader2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PropertyOverviewTab from "../components/property/PropertyOverviewTab";
import PropertyUnitsTab from "../components/property/PropertyUnitsTab";
import PropertyMaintenanceTab from "../components/property/PropertyMaintenanceTab";
import PropertyFinancialsTab from "../components/property/PropertyFinancialsTab";
import PropertyDocumentsTab from "../components/property/PropertyDocumentsTab";
import PropertyPhotosTab from "../components/property/PropertyPhotosTab";

export default function PropertyProfile({ propertyId, onBack }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [props, units, tenants, leases, orders, payments, docs] = await Promise.all([
      base44.entities.Property.filter({ id: propertyId }),
      base44.entities.Unit.filter({ property_id: propertyId }),
      base44.entities.Tenant.list(),
      base44.entities.Lease.list(),
      base44.entities.WorkOrder.filter({ property_id: propertyId }),
      base44.entities.Payment.list(),
      base44.entities.Document.filter({ property_id: propertyId }),
    ]);
    setProperty({
      data: props[0] || {},
      units,
      tenants,
      leases,
      orders,
      payments,
      docs,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [propertyId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { data, units, tenants, leases, orders, payments, docs } = property;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-outfit font-bold">{data.nickname || data.address}</h1>
          <p className="text-sm text-muted-foreground">{data.address}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PropertyOverviewTab property={data} onSaved={load} />
        </TabsContent>
        <TabsContent value="units">
          <PropertyUnitsTab units={units} tenants={tenants} leases={leases} />
        </TabsContent>
        <TabsContent value="maintenance">
          <PropertyMaintenanceTab orders={orders} />
        </TabsContent>
        <TabsContent value="financials">
          <PropertyFinancialsTab units={units} leases={leases} payments={payments} orders={orders} />
        </TabsContent>
        <TabsContent value="documents">
          <PropertyDocumentsTab propertyId={propertyId} docs={docs} onRefresh={load} />
        </TabsContent>
        <TabsContent value="photos">
          <PropertyPhotosTab property={data} onSaved={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
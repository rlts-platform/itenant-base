import { useState } from "react";
import DateRangeFilter, { getDateRange } from "../components/analytics/DateRangeFilter";
import RevenueSection from "../components/analytics/RevenueSection";
import OccupancySection from "../components/analytics/OccupancySection";
import MaintenanceSection from "../components/analytics/MaintenanceSection";
import TenantSection from "../components/analytics/TenantSection";

export default function Analytics() {
  const [dateFilter, setDateFilter] = useState("6months");
  const dateRange = getDateRange(dateFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">View detailed insights across your portfolio</p>
      </div>

      {/* Date range filter */}
      <div className="bg-white border border-border rounded-xl p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">Date Range</span>
        <DateRangeFilter selected={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <RevenueSection dateRange={dateRange} />
        <OccupancySection dateRange={dateRange} />
        <MaintenanceSection dateRange={dateRange} />
        <TenantSection dateRange={dateRange} />
      </div>
    </div>
  );
}
import { useState, Component } from "react";
import DateRangeFilter, { getDateRange } from "../components/analytics/DateRangeFilter";
import RevenueSection from "../components/analytics/RevenueSection";
import OccupancySection from "../components/analytics/OccupancySection";
import MaintenanceSection from "../components/analytics/MaintenanceSection";
import TenantSection from "../components/analytics/TenantSection";

class AnalyticsErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-10 text-center">
            <p className="font-semibold text-red-700">Analytics failed to load.</p>
            <p className="text-sm text-red-600 mt-2">Please refresh the page or contact support if the issue persists.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnalyticsInner() {
  const [dateFilter, setDateFilter] = useState("6months");
  const dateRange = getDateRange(dateFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-outfit font-bold" style={{ color: '#1A1A2E' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>View detailed insights across your portfolio</p>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">Date Range</span>
        <DateRangeFilter selected={dateFilter} onChange={setDateFilter} />
      </div>

      <div className="space-y-6">
        <RevenueSection dateRange={dateRange} />
        <OccupancySection dateRange={dateRange} />
        <MaintenanceSection dateRange={dateRange} />
        <TenantSection dateRange={dateRange} />
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsInner />
    </AnalyticsErrorBoundary>
  );
}
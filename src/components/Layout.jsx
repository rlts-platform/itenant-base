import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Building2, Home, Users, FileText, Wrench,
  CreditCard, BarChart3, FolderOpen, MessageSquare, Package,
  Users2, Zap, Settings, ChevronLeft, ChevronRight, LogOut,
  Bell, Menu, X, DollarSign, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const clientNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Properties", icon: Building2, to: "/properties" },
  { label: "Units", icon: Home, to: "/units" },
  { label: "Tenants", icon: Users, to: "/tenants" },
  { label: "Leases", icon: FileText, to: "/leases" },
  { label: "Maintenance", icon: Wrench, to: "/maintenance" },
  { label: "Payments", icon: CreditCard, to: "/payments" },
  { label: "Financials", icon: BarChart3, to: "/financials" },
  { label: "Documents", icon: FolderOpen, to: "/documents" },
  { label: "Messages", icon: MessageSquare, to: "/messages" },
  { label: "Vendors", icon: Package, to: "/vendors" },
  { label: "Automations", icon: Zap, to: "/automations" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

const tenantNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/tenant" },
  { label: "Pay Rent", icon: DollarSign, to: "/tenant/pay" },
  { label: "Maintenance", icon: Wrench, to: "/tenant/maintenance" },
  { label: "Documents", icon: FolderOpen, to: "/tenant/documents" },
  { label: "Messages", icon: MessageSquare, to: "/tenant/messages" },
  { label: "Profile", icon: Users, to: "/tenant/profile" },
];

const ownerNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/owner" },
  { label: "Clients", icon: Users2, to: "/owner/clients" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role || "user";
  const nav = role === "platform_owner" ? ownerNav : location.pathname.startsWith("/tenant") ? tenantNav : clientNav;

  const NavLink = ({ item }) => {
    const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
    return (
      <Link
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
          active
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
        )}
      >
        <item.icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
        {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
      </Link>
    );
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      "flex flex-col h-full bg-sidebar",
      mobile ? "w-64" : collapsed ? "w-16" : "w-60"
    )}>
      <div className={cn("flex items-center p-4", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="font-outfit font-700 text-white text-lg tracking-tight">iTenant</span>}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(item => <NavLink key={item.to} item={item} />)}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => base44.auth.logout()}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 relative transition-all duration-200" style={{ width: collapsed ? 64 : 240 }}>
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
              {user?.full_name?.[0] || "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
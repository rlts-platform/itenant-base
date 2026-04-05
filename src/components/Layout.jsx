import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Home, Users, FileText, Wrench,
  CreditCard, BarChart3, FolderOpen, MessageSquare, Package,
  Users2, Zap, Settings, LogOut, Bell, Menu, DollarSign, ShieldCheck, UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const clientNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Properties", icon: Building2, to: "/properties" },
  { label: "Units", icon: Home, to: "/units" },
  { label: "Tenants", icon: Users, to: "/tenants" },
  { label: "Leases", icon: FileText, to: "/leases" },
  { label: "Maintenance", icon: Wrench, to: "/maintenance" },
  { label: "Messages", icon: MessageSquare, to: "/messages" },
  { label: "Payments", icon: CreditCard, to: "/payments" },
  { label: "Financials", icon: BarChart3, to: "/financials" },
  { label: "Documents", icon: FolderOpen, to: "/documents" },
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
  { label: "Community", icon: Users2, to: "/tenant/community" },
  { label: "Profile", icon: UserCircle, to: "/tenant/profile" },
];

const ownerNav = [
  { label: "Owner Dashboard", icon: LayoutDashboard, to: "/owner" },
  { label: "Clients", icon: Users2, to: "/owner/clients" },
  { label: "Revenue", icon: BarChart3, to: "/owner/revenue" },
  { label: "Settings", icon: Settings, to: "/owner/settings" },
];

export default function Layout() {
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
          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          active ? "text-primary" : "text-sidebar-foreground hover:text-foreground hover:bg-secondary/60"
        )}
      >
        {active && (
          <motion.div
            layoutId="nav-active"
            className="absolute inset-0 bg-accent rounded-xl"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
        <item.icon className={cn("relative w-4 h-4 shrink-0 transition-transform duration-200", active ? "text-primary" : "group-hover:scale-110")} />
        <span className="relative text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-outfit font-800 text-foreground text-xl tracking-tight">iTenant</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(item => <NavLink key={item.to} item={item} />)}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.full_name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  const pageKey = location.pathname;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 w-60">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="absolute left-0 top-0 h-full w-64"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-white px-4 flex items-center justify-between shrink-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
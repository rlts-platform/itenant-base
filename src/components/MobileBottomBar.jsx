import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Users, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function MobileBottomBar() {
  const location = useLocation();
  const { user } = useAuth();

  const isTenant = user?.role === "tenant";
  const isOwner = user?.role === "platform_owner";

  const routes = isTenant
    ? [
        { path: "/tenant", label: "Dashboard", icon: LayoutDashboard },
        { path: "/tenant/maintenance", label: "Maintenance", icon: Building2 },
        { path: "/tenant/documents", label: "Documents", icon: Users },
        { path: "/tenant/messages", label: "Messages", icon: MessageSquare },
      ]
    : [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/properties", label: "Properties", icon: Building2 },
        { path: "/tenants", label: "Tenants", icon: Users },
        { path: "/messages", label: "Messages", icon: MessageSquare },
      ];

  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center justify-around safe-bottom z-40">
      {routes.map(route => {
        const active = isActive(route.path);
        return (
          <Link
            key={route.path}
            to={route.path}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
            style={{ color: active ? "#7C6FCD" : "#9CA3AF" }}
          >
            <route.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{route.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
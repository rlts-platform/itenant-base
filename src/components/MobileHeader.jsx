import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRootPath = location.pathname === "/" || location.pathname === "/tenant" || location.pathname === "/owner";

  if (isRootPath) return null;

  return (
    <div className="hidden md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40 safe-top">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
        <ChevronLeft className="w-5 h-5" />
      </Button>
    </div>
  );
}
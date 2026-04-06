import { Eye } from "lucide-react";

export default function ViewOnlyBanner() {
  return (
    <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      <Eye className="w-4 h-4 shrink-0 text-amber-600" />
      <span>Your account is view-only. Contact your account owner to make changes.</span>
    </div>
  );
}
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShareApplicationLink({ propertyId, propertyName }) {
  const handleShare = async () => {
    if (!propertyId) {
      toast.error("Property ID not found");
      return;
    }

    // Construct the application URL
    const appUrl = `${window.location.origin}/apply/${propertyId}`;

    // Try Web Share API first (mobile-friendly)
    if (navigator.share && navigator.canShare({ text: "Apply now!", url: appUrl })) {
      try {
        await navigator.share({
          title: "Apply for this Property",
          text: `Check out this property application: ${propertyName || "Property"}`,
          url: appUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
        // Fall through to clipboard on cancel or error
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(appUrl);
      toast.success("Application link copied to clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" className="gap-2 w-full sm:w-auto">
      <Share2 className="w-4 h-4" />
      <span className="hidden sm:inline">Share Application Link</span>
      <span className="sm:hidden">Share</span>
    </Button>
  );
}
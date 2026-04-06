import { useState } from "react";
import { Copy, Share2, Check, ExternalLink, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const POSTING_SITES = [
  {
    name: "Zillow Rental Manager",
    url: "https://www.zillow.com/rental-manager/",
    color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    icon: "🏠",
  },
  {
    name: "Apartments.com",
    url: "https://www.apartments.com/add-listing/",
    color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    icon: "🏢",
  },
  {
    name: "Facebook Marketplace",
    url: "https://www.facebook.com/marketplace/create/rental",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
    icon: "📘",
  },
];

export default function GetFirstApplicationCard({ propertyId, propertyName }) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const appUrl = propertyId
    ? `${window.location.origin}/apply/${propertyId}`
    : null;

  const handleCopy = async () => {
    if (!appUrl) { toast.error("No property found to generate a link for."); return; }
    await navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success("Application link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!appUrl) { toast.error("No property found to generate a link for."); return; }
    if (navigator.share && navigator.canShare({ url: appUrl })) {
      try {
        await navigator.share({
          title: "Apply for this Property",
          text: `Apply for ${propertyName || "this rental"} here:`,
          url: appUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") toast.error("Share failed. Try copying the link instead.");
      }
    } else {
      // Fallback to clipboard
      handleCopy();
    }
  };

  return (
    <div className="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-8 space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl mb-2">🚀</div>
        <h2 className="text-xl font-outfit font-bold">Get Your First Application</h2>
        <p className="text-sm text-muted-foreground">Share your unique application link and start receiving qualified applicants.</p>
        {appUrl && (
          <p className="text-xs font-mono bg-secondary/60 text-muted-foreground rounded-lg px-3 py-2 break-all">{appUrl}</p>
        )}
      </div>

      {/* Step 1 & 2 */}
      <div className="space-y-3">
        <button
          onClick={handleCopy}
          disabled={!appUrl}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-secondary/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${copied ? "bg-emerald-100" : "bg-primary/10"}`}>
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <p className="font-semibold text-sm">{copied ? "Copied!" : "Copy Link to Clipboard"}</p>
            <p className="text-xs text-muted-foreground">Paste it anywhere — texts, emails, social posts</p>
          </div>
        </button>

        <button
          onClick={handleShare}
          disabled={!appUrl}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-secondary/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Share via Text or Email</p>
            <p className="text-xs text-muted-foreground">Opens your device's share sheet</p>
          </div>
        </button>

        {/* Step 3 — collapsible guide */}
        <button
          onClick={() => setShowGuide(g => !g)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-secondary/40 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Where to Post It</p>
            <p className="text-xs text-muted-foreground">Listing sites that get the most applicants</p>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        </button>

        {showGuide && (
          <div className="space-y-2 pl-4">
            <p className="text-xs text-muted-foreground pb-1">
              Create a listing on any of these platforms, then paste your application link in the listing description or contact section.
            </p>
            {POSTING_SITES.map(site => (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${site.color}`}
              >
                <span className="flex items-center gap-2 font-medium text-sm">
                  <span>{site.icon}</span>
                  {site.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
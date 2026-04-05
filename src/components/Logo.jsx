export default function Logo({ variant = "horizontal", size = "md", onClick, className = "" }) {
  const logoUrl = "https://media.base44.com/images/public/69d176412565789962328166/960125f1e_Gemini_Generated_Image_kdh3k3kdh3k3kdh3.png";

  // Icon sizes in pixels
  const iconSizes = { sm: 24, md: 32, lg: 36, xl: 48 };
  const iconSize = iconSizes[size] || 32;

  // Icon mark only (hexagon house)
  if (variant === "icon") {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 cursor-pointer ${className}`}
        onClick={onClick}
      >
        {/* Hexagon house shape */}
        <path d="M100 20L160 60V140L100 180L40 140V60Z" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
        {/* Roof triangle */}
        <path d="M60 60L100 20L140 60" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
        {/* Door/window - iT mark */}
        <rect x="85" y="90" width="12" height="35" fill="#7C6FCD" rx="2" />
        <rect x="82" y="70" width="18" height="18" fill="#7C6FCD" rx="2" />
      </svg>
    );
  }

  // Horizontal lockup (icon + wordmark side-by-side)
  if (variant === "horizontal") {
    return (
      <div className={`flex items-center gap-2 cursor-pointer ${className}`} onClick={onClick}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path d="M100 20L160 60V140L100 180L40 140V60Z" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
          <path d="M60 60L100 20L140 60" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
          <rect x="85" y="90" width="12" height="35" fill="#7C6FCD" rx="2" />
          <rect x="82" y="70" width="18" height="18" fill="#7C6FCD" rx="2" />
        </svg>
        <div className="flex items-baseline gap-1">
          <span className="font-outfit font-700 text-foreground" style={{ color: "#7C6FCD" }}>
            i
          </span>
          <span className="font-outfit font-700 text-foreground" style={{ color: "#1A1A2E" }}>
            Tenant
          </span>
        </div>
      </div>
    );
  }

  // Stacked lockup (icon above, wordmark below)
  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 cursor-pointer ${className}`} onClick={onClick}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path d="M100 20L160 60V140L100 180L40 140V60Z" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
          <path d="M60 60L100 20L140 60" fill="none" stroke="#7C6FCD" strokeWidth="12" strokeLinejoin="round" />
          <rect x="85" y="90" width="12" height="35" fill="#7C6FCD" rx="2" />
          <rect x="82" y="70" width="18" height="18" fill="#7C6FCD" rx="2" />
        </svg>
        <div className="flex items-baseline gap-0.5">
          <span className="font-outfit font-700 text-foreground text-sm" style={{ color: "#7C6FCD" }}>
            i
          </span>
          <span className="font-outfit font-700 text-foreground text-sm" style={{ color: "#1A1A2E" }}>
            Tenant
          </span>
        </div>
      </div>
    );
  }

  return null;
}
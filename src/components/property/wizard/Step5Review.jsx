export default function Step5Review({ data }) {
  const address = [data.street, data.city, data.state, data.zip].filter(Boolean).join(", ");
  const units = data.units || [];

  const row = (label, val) => val ? (
    <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="text-sm" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-sm font-medium text-white">{val}</span>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Review & Save</h2>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>Everything looks good? Hit Save Property to create your listing.</p>
      </div>

      {/* Property summary */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7C6FCD" }}>Property</p>
        {row("Address", address)}
        {row("Type", data.type)}
        {row("Nickname", data.nickname)}
        {row("Year Built", data.year_built)}
        {row("Neighborhood", data.neighborhood)}
      </div>

      {/* Units mini-table */}
      {units.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7C6FCD" }}>Units ({units.length})</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#9CA3AF" }}>
                  {["Unit", "Beds", "Baths", "Sq Ft", "Rent", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map((u, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#fff" }}>
                    <td style={{ padding: "6px 8px" }}>{u.unit_number || `#${i + 1}`}</td>
                    <td style={{ padding: "6px 8px" }}>{u.bedrooms || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{u.bathrooms || "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{u.sqft ? `${u.sqft} sqft` : "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{u.rent_amount ? `$${Number(u.rent_amount).toLocaleString()}` : "—"}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: u.status === "occupied" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)", color: u.status === "occupied" ? "#F59E0B" : "#22C55E" }}>
                        {u.status || "vacant"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details summary */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7C6FCD" }}>Details</p>
        {row("Parking", data.parking_type ? `${data.parking_type}${data.parking_spaces ? ` (${data.parking_spaces} spaces)` : ""}` : null)}
        {row("Laundry", data.laundry?.replace("_", "-"))}
        {row("Utilities Included", (data.utilities_included || []).join(", ") || "None")}
        {row("Pet Policy", data.pet_policy?.replace("_", " "))}
        {row("HOA", data.has_hoa === "yes" ? `Yes — ${data.hoa_name || ""} $${data.hoa_monthly_fee || 0}/mo` : "No")}
      </div>
    </div>
  );
}
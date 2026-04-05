// Small read-only display of configured recipients on a card

export default function RecipientBadges({ rule, tenants, properties }) {
  const mode = rule.recipient_mode || "all";
  const propId = rule.recipient_property_id;
  const tenantIds = rule.recipient_tenant_ids || [];

  const propName = (id) => { const p = properties.find(p => p.id === id); return p?.nickname || p?.address || "Property"; };
  const tenantName = (id) => { const t = tenants.find(t => t.id === id); return t ? `${t.first_name} ${t.last_name}` : id; };

  if (mode === "all") return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">All Tenants</span>
  );
  if (mode === "property" && propId) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">All at {propName(propId)}</span>
  );
  if (mode === "specific" && tenantIds.length > 0) return (
    <div className="flex flex-wrap gap-1">
      {tenantIds.map(id => (
        <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{tenantName(id)}</span>
      ))}
    </div>
  );
  return <span className="text-xs text-muted-foreground">Not configured</span>;
}
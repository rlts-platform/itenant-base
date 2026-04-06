import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This runs as a scheduled job — use service role
    const leases = await base44.asServiceRole.entities.Lease.filter({ status: "active" });
    const today = new Date();
    const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in59Days = new Date(today.getTime() + 59 * 24 * 60 * 60 * 1000);

    // Find leases expiring in exactly 60 days (within today's window)
    const expiring = leases.filter(l => {
      if (!l.end_date) return false;
      const end = new Date(l.end_date);
      return end >= in59Days && end <= in60Days;
    });

    console.log(`Found ${expiring.length} lease(s) expiring in ~60 days`);

    if (expiring.length === 0) {
      return Response.json({ sent: 0 });
    }

    // Fetch tenants + accounts so we can email the right property manager
    const [tenants, units, properties, users] = await Promise.all([
      base44.asServiceRole.entities.Tenant.list(),
      base44.asServiceRole.entities.Unit.list(),
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    // Get admin users to notify (property managers)
    const adminUsers = users.filter(u => u.role === "admin");

    let sent = 0;
    for (const lease of expiring) {
      const tenant = tenants.find(t => t.id === lease.tenant_id);
      const unit = units.find(u => u.id === lease.unit_id);
      const property = unit ? properties.find(p => p.id === unit.property_id) : null;

      const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unknown Tenant";
      const propertyLabel = property?.nickname || property?.address || "Unknown Property";
      const unitLabel = unit ? `Unit ${unit.unit_number}` : "";
      const expiryDate = new Date(lease.end_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      for (const admin of adminUsers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `⚠️ Lease Expiring in 60 Days — ${tenantName}`,
          body: `Hi ${admin.full_name || "there"},

This is an automated reminder from iTenant.

The following lease is expiring in 60 days:

  • Tenant: ${tenantName}
  • Property: ${propertyLabel}${unitLabel ? ` — ${unitLabel}` : ""}
  • Lease End Date: ${expiryDate}
  • Monthly Rent: $${lease.rent_amount?.toLocaleString() || "—"}

To generate a renewal agreement, go to the Tenants page, open ${tenantName}'s profile, and click "Renew Lease" in the lease section.

— iTenant Notification System`,
        });
        sent++;
        console.log(`Sent 60-day expiry alert to ${admin.email} for tenant ${tenantName}`);
      }
    }

    return Response.json({ sent, expiring: expiring.length });
  } catch (error) {
    console.error("leaseExpiryAlert error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
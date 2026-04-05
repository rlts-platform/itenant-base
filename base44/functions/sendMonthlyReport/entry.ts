import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { recipient_email, recipient_name, month_label } = body;

    // Use service role to read all data
    const [properties, units, tenants, leases, payments, orders] = await Promise.all([
      base44.asServiceRole.entities.Property.list(),
      base44.asServiceRole.entities.Unit.list(),
      base44.asServiceRole.entities.Tenant.list(),
      base44.asServiceRole.entities.Lease.list(),
      base44.asServiceRole.entities.Payment.list("-date"),
      base44.asServiceRole.entities.WorkOrder.list("-created_date"),
    ]);

    // Determine reporting month (current month)
    const now = new Date();
    const label = month_label || `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    const monthPrefix = now.toISOString().substring(0, 7); // e.g. "2026-04"

    // Rent collected this month
    const monthPayments = payments.filter(p => p.status === 'confirmed' && (p.date || '').startsWith(monthPrefix));
    const rentCollected = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending' && (p.date || '').startsWith(monthPrefix));
    const pendingRent = pendingPayments.reduce((s, p) => s + (p.amount || 0), 0);

    // Maintenance
    const openOrders = orders.filter(o => o.status !== 'closed');
    const emergencyOrders = openOrders.filter(o => o.urgency === 'emergency');
    const closedThisMonth = orders.filter(o => o.status === 'closed' && (o.updated_date || '').startsWith(monthPrefix));
    const maintenanceCost = orders
      .filter(o => (o.created_date || '').startsWith(monthPrefix) && o.cost)
      .reduce((s, o) => s + (o.cost || 0), 0);

    // Net cash flow
    const netCashFlow = rentCollected - maintenanceCost;

    // Active leases
    const activeLeases = leases.filter(l => l.status === 'active');
    const occupiedUnitIds = new Set(activeLeases.map(l => l.unit_id));
    const vacantUnits = units.filter(u => !occupiedUnitIds.has(u.id));
    const occupancyRate = units.length > 0 ? Math.round((occupiedUnitIds.size / units.length) * 100) : 0;

    // Per-property breakdown
    const propById = Object.fromEntries(properties.map(p => [p.id, p]));
    const unitById = Object.fromEntries(units.map(u => [u.id, u]));
    const tenantById = Object.fromEntries(tenants.map(t => [t.id, t]));

    const propBreakdown = properties.map(prop => {
      const propUnits = units.filter(u => u.property_id === prop.id);
      const propUnitIds = new Set(propUnits.map(u => u.id));
      const propTenantIds = new Set(activeLeases.filter(l => propUnitIds.has(l.unit_id)).map(l => l.tenant_id));
      const income = monthPayments.filter(p => propTenantIds.has(p.tenant_id)).reduce((s, p) => s + (p.amount || 0), 0);
      const expenses = orders.filter(o => (o.created_date || '').startsWith(monthPrefix) && o.cost && (o.property_id === prop.id || propUnitIds.has(o.unit_id))).reduce((s, o) => s + (o.cost || 0), 0);
      const occupied = propUnits.filter(u => occupiedUnitIds.has(u.id)).length;
      return { name: prop.nickname || prop.address, units: propUnits.length, occupied, income, expenses, net: income - expenses };
    });

    const fmt = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

    // Build HTML email
    const propRows = propBreakdown.map(p => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;color:#1A1A2E;font-size:13px;">${p.name}</td>
        <td style="padding:10px 12px;text-align:center;color:#6B7280;font-size:13px;">${p.occupied}/${p.units}</td>
        <td style="padding:10px 12px;text-align:right;color:#22C55E;font-size:13px;font-weight:600;">${fmt(p.income)}</td>
        <td style="padding:10px 12px;text-align:right;color:#EF4444;font-size:13px;">${fmt(p.expenses)}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:13px;color:${p.net >= 0 ? '#22C55E' : '#EF4444'}">${fmt(p.net)}</td>
      </tr>`).join('');

    const openOrdersList = openOrders.slice(0, 5).map(o => `
      <li style="margin-bottom:6px;font-size:13px;color:#1A1A2E;">
        <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;margin-right:6px;background:${o.urgency === 'emergency' ? '#FEE2E2' : o.urgency === 'urgent' ? '#FEF3C7' : '#F3F4F6'};color:${o.urgency === 'emergency' ? '#EF4444' : o.urgency === 'urgent' ? '#F59E0B' : '#6B7280'};">${o.urgency?.toUpperCase()}</span>
        ${o.summary}
      </li>`).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F3FF;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(124,111,205,0.12);border:1px solid rgba(124,111,205,0.15);">
    
    <!-- Header -->
    <div style="background:#7C6FCD;padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:16px;">🏠</span>
        </div>
        <span style="color:#fff;font-weight:800;font-size:18px;letter-spacing:-0.5px;">iTenant</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;letter-spacing:-0.5px;">Monthly Property Report</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">${label}</p>
    </div>

    <div style="padding:28px 32px;">
      <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">Hi ${recipient_name || 'there'}, here's your property portfolio summary for <strong style="color:#1A1A2E;">${label}</strong>.</p>

      <!-- KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:28px;">
        <div style="background:#F4F3FF;border-radius:12px;padding:16px 18px;border:1px solid rgba(124,111,205,0.12);">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7C6FCD;margin:0 0 4px;">Rent Collected</p>
          <p style="font-size:24px;font-weight:800;color:#22C55E;margin:0;">${fmt(rentCollected)}</p>
          ${pendingRent > 0 ? `<p style="font-size:12px;color:#F59E0B;margin:4px 0 0;">${fmt(pendingRent)} pending</p>` : ''}
        </div>
        <div style="background:#F4F3FF;border-radius:12px;padding:16px 18px;border:1px solid rgba(124,111,205,0.12);">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7C6FCD;margin:0 0 4px;">Net Cash Flow</p>
          <p style="font-size:24px;font-weight:800;color:${netCashFlow >= 0 ? '#22C55E' : '#EF4444'};margin:0;">${fmt(netCashFlow)}</p>
          <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">${fmt(maintenanceCost)} in maintenance</p>
        </div>
        <div style="background:#F4F3FF;border-radius:12px;padding:16px 18px;border:1px solid rgba(124,111,205,0.12);">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7C6FCD;margin:0 0 4px;">Occupancy Rate</p>
          <p style="font-size:24px;font-weight:800;color:#1A1A2E;margin:0;">${occupancyRate}%</p>
          <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">${vacantUnits.length} vacant unit${vacantUnits.length !== 1 ? 's' : ''}</p>
        </div>
        <div style="background:#F4F3FF;border-radius:12px;padding:16px 18px;border:1px solid rgba(124,111,205,0.12);">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7C6FCD;margin:0 0 4px;">Open Maintenance</p>
          <p style="font-size:24px;font-weight:800;color:${emergencyOrders.length > 0 ? '#EF4444' : '#1A1A2E'};margin:0;">${openOrders.length}</p>
          <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">${emergencyOrders.length} emergency${emergencyOrders.length !== 1 ? 's' : ''} · ${closedThisMonth.length} closed this month</p>
        </div>
      </div>

      <!-- Property Breakdown -->
      ${propBreakdown.length > 0 ? `
      <h2 style="font-size:15px;font-weight:700;color:#1A1A2E;margin:0 0 12px;">Property Breakdown</h2>
      <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(124,111,205,0.12);margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#F4F3FF;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C6FCD;">Property</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C6FCD;">Occupancy</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C6FCD;">Income</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C6FCD;">Expenses</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C6FCD;">Net</th>
            </tr>
          </thead>
          <tbody>${propRows}</tbody>
        </table>
      </div>` : ''}

      <!-- Open Maintenance -->
      ${openOrders.length > 0 ? `
      <h2 style="font-size:15px;font-weight:700;color:#1A1A2E;margin:0 0 12px;">Pending Maintenance (${openOrders.length} open)</h2>
      <div style="background:#FFF9F0;border-radius:12px;padding:16px 18px;border:1px solid rgba(245,158,11,0.2);margin-bottom:28px;">
        <ul style="margin:0;padding-left:16px;">${openOrdersList}</ul>
        ${openOrders.length > 5 ? `<p style="font-size:12px;color:#6B7280;margin:8px 0 0;">+ ${openOrders.length - 5} more open work orders</p>` : ''}
      </div>` : `
      <div style="background:#F0FDF4;border-radius:12px;padding:16px 18px;border:1px solid rgba(34,197,94,0.2);margin-bottom:28px;">
        <p style="font-size:14px;color:#22C55E;font-weight:600;margin:0;">✓ No open maintenance requests — great work!</p>
      </div>`}

      <!-- Footer -->
      <div style="border-top:1px solid rgba(124,111,205,0.12);padding-top:20px;text-align:center;">
        <p style="font-size:12px;color:#6B7280;margin:0;">This report was automatically generated by <strong>iTenant</strong>.</p>
        <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">Log in to your dashboard for full details and analytics.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const to = recipient_email;
    if (!to) {
      return Response.json({ error: 'recipient_email is required' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: `📊 Your Monthly Property Report — ${label}`,
      body: emailHtml,
      from_name: "iTenant Reports",
    });

    console.log(`Monthly report sent to ${to} for ${label}`);
    return Response.json({
      success: true,
      sent_to: to,
      month: label,
      summary: { rentCollected, netCashFlow, maintenanceCost, openOrders: openOrders.length, occupancyRate },
    });

  } catch (error) {
    console.error('sendMonthlyReport error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
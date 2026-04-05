import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function addBusinessDays(date, days) {
  let count = 0;
  let d = new Date(date);
  while (count < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return d;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id } = await req.json();
    if (!tenant_id) return Response.json({ error: 'tenant_id required' }, { status: 400 });

    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
    const tenant = tenants[0];
    if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 });

    const token = crypto.randomUUID();
    const expires_at = addBusinessDays(new Date(), 14).toISOString();

    // Expire any existing pending invites for this tenant
    const existing = await base44.asServiceRole.entities.TenantInvite.filter({ tenant_id, status: 'pending' });
    for (const inv of existing) {
      await base44.asServiceRole.entities.TenantInvite.update(inv.id, { status: 'expired' });
    }

    await base44.asServiceRole.entities.TenantInvite.create({
      token,
      tenant_id,
      email: tenant.email,
      status: 'pending',
      expires_at,
      account_id: tenant.account_id || ''
    });

    const appUrl = req.headers.get('origin') || 'https://app.itenant.com';
    const inviteLink = `${appUrl}/invite/${token}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tenant.email,
      subject: 'You\'ve been invited to iTenant',
      body: `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="margin-bottom: 8px;">Welcome to iTenant, ${tenant.first_name}!</h2>
          <p style="color: #555;">Your property manager has invited you to manage your rental account online.</p>
          <p style="color: #555;">This invitation expires in 14 business days.</p>
          <a href="${inviteLink}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#4f6ef7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:32px;">Or copy this link: ${inviteLink}</p>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendTenantInvite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
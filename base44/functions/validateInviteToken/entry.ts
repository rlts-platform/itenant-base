import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'token required' }, { status: 400 });

    const invites = await base44.asServiceRole.entities.TenantInvite.filter({ token });
    const invite = invites[0];
    if (!invite) return Response.json({ valid: false, reason: 'not_found' });

    // Check expiry
    if (new Date(invite.expires_at) < new Date() && invite.status === 'pending') {
      await base44.asServiceRole.entities.TenantInvite.update(invite.id, { status: 'expired' });
      return Response.json({ valid: false, reason: 'expired' });
    }
    if (invite.status === 'expired') return Response.json({ valid: false, reason: 'expired' });
    if (invite.status === 'accepted') return Response.json({ valid: false, reason: 'already_accepted' });

    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: invite.tenant_id });
    const tenant = tenants[0];

    return Response.json({ valid: true, invite, tenant });
  } catch (error) {
    console.error('validateInviteToken error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
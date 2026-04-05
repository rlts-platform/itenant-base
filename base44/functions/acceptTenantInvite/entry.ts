import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return Response.json({ error: 'token required' }, { status: 400 });

    const invites = await base44.asServiceRole.entities.TenantInvite.filter({ token });
    const invite = invites[0];
    if (!invite) return Response.json({ error: 'Invalid token' }, { status: 404 });

    if (invite.status === 'accepted') return Response.json({ success: true, already: true });

    if (new Date(invite.expires_at) < new Date()) {
      await base44.asServiceRole.entities.TenantInvite.update(invite.id, { status: 'expired' });
      return Response.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check email matches
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return Response.json({ error: 'This invitation was sent to a different email address.' }, { status: 403 });
    }

    // Mark invite accepted
    await base44.asServiceRole.entities.TenantInvite.update(invite.id, { status: 'accepted' });

    // Update tenant status to active
    await base44.asServiceRole.entities.Tenant.update(invite.tenant_id, { status: 'active' });

    // Update user role to tenant
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    if (users[0]) {
      await base44.asServiceRole.entities.User.update(users[0].id, { role: 'tenant' });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('acceptTenantInvite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
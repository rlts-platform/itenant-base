import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { team_member_id } = await req.json();
    if (!team_member_id) return Response.json({ error: 'team_member_id required' }, { status: 400 });

    const members = await base44.asServiceRole.entities.TeamMember.filter({ id: team_member_id });
    const member = members[0];
    if (!member) return Response.json({ error: 'Team member not found' }, { status: 404 });

    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.TeamMember.update(team_member_id, {
      invite_token: token,
      invite_expires_at: expires_at,
      status: 'invited',
    });

    const appUrl = req.headers.get('origin') || 'https://app.base44.com';
    const inviteLink = `${appUrl}/team-invite/${token}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: member.email,
      subject: `You've been invited to join iTenant`,
      body: `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="margin-bottom: 8px;">You've been invited to iTenant</h2>
          <p style="color: #555;">Hi ${member.name},</p>
          <p style="color: #555;">You've been invited to join as a <strong>${(member.team_role || member.role || '').replace('_', ' ')}</strong> on the property management team.</p>
          <a href="${inviteLink}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#4f6ef7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:32px;">This link expires in 14 days. Or copy: ${inviteLink}</p>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('inviteTeamMember error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
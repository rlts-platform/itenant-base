import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) return Response.json({ error: 'token required' }, { status: 400 });

    // Find the team member record by token
    const members = await base44.asServiceRole.entities.TeamMember.filter({ invite_token: token });
    const member = members[0];

    if (!member) return Response.json({ error: 'Invalid invitation link', reason: 'invalid' }, { status: 404 });

    if (member.status === 'active') return Response.json({ success: true, already_accepted: true });

    if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
      return Response.json({ error: 'Invitation has expired', reason: 'expired' }, { status: 410 });
    }

    // Get the authenticated user
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'You must be logged in to accept this invitation', reason: 'auth_required' }, { status: 401 });

    // Create or update AppUser record for this team member
    const existing = await base44.asServiceRole.entities.AppUser.filter({ user_email: user.email });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.AppUser.update(existing[0].id, {
        role: 'team_member',
        team_role: member.team_role,
        account_id: member.account_id,
        onboarding_complete: true,
      });
    } else {
      await base44.asServiceRole.entities.AppUser.create({
        user_email: user.email,
        role: 'team_member',
        team_role: member.team_role,
        account_id: member.account_id,
        onboarding_complete: true,
      });
    }

    // Mark team member as active
    await base44.asServiceRole.entities.TeamMember.update(member.id, {
      status: 'active',
      invite_token: null,
    });

    return Response.json({ success: true, account_id: member.account_id });
  } catch (error) {
    console.error('acceptTeamMemberInvite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
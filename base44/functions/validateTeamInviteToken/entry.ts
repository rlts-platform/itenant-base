import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) return Response.json({ valid: false, reason: 'invalid' });

    const members = await base44.asServiceRole.entities.TeamMember.filter({ invite_token: token });
    const member = members[0];

    if (!member) return Response.json({ valid: false, reason: 'invalid' });
    if (member.status === 'active') return Response.json({ valid: false, reason: 'already_accepted' });
    if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
      return Response.json({ valid: false, reason: 'expired' });
    }

    return Response.json({
      valid: true,
      member: {
        name: member.name,
        email: member.email,
        team_role: member.team_role,
      }
    });
  } catch (error) {
    console.error('validateTeamInviteToken error:', error);
    return Response.json({ valid: false, reason: 'error' });
  }
});
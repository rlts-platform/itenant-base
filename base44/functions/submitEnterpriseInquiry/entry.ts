import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { full_name, business_name, email, phone, units_count, message } = body;

    if (!full_name || !business_name || !email || !phone || units_count === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store inquiry in database
    const inquiry = await base44.asServiceRole.entities.Inquiry.create({
      full_name,
      business_name,
      email,
      phone,
      units_count: Number(units_count),
      message: message || '',
      status: 'New',
      submitted_at: new Date().toISOString(),
    });

    // Send email notification
    const emailBody = `
New Enterprise Plan Inquiry

Full Name: ${full_name}
Business Name: ${business_name}
Email: ${email}
Phone: ${phone}
Approximate Units: ${units_count}
Message: ${message || '(None provided)'}

Submitted: ${new Date().toLocaleString()}

Inquiry ID: ${inquiry.id}
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: 'jarivera43019@gmail.com',
      subject: `New Enterprise Plan Inquiry from ${business_name}`,
      body: emailBody,
      from_name: 'iTenant',
    });

    return Response.json({ success: true, inquiry_id: inquiry.id });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
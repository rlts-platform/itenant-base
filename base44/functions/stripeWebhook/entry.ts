import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = await import('npm:stripe@14.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  try {
    // Verify Stripe signature BEFORE auth
    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    console.log(`Webhook event type: ${event.type}`);

    // NOW do base44 auth
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { tenant_id, lease_id, tenant_email } = session.metadata;

      if (!tenant_id || !lease_id) {
        console.warn('Missing metadata in checkout session');
        return Response.json({ received: true });
      }

      // Retrieve session details to confirm payment
      const completedSession = await stripe.checkout.sessions.retrieve(session.id);
      if (completedSession.payment_status !== 'paid') {
        console.warn(`Payment not completed for session ${session.id}`);
        return Response.json({ received: true });
      }

      // Create payment record
      const payment = await base44.asServiceRole.entities.Payment.create({
        tenant_id,
        amount: completedSession.amount_total / 100, // Convert from cents
        method: 'stripe',
        status: 'confirmed',
        date: new Date().toISOString().split('T')[0],
        proof_image_url: session.id, // Store session ID as reference
      });

      // Update tenant payment status in database
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Check if any payments this month
      const monthPayments = await base44.asServiceRole.entities.Payment.filter({
        tenant_id,
        date: { $gte: monthStart.toISOString().split('T')[0] },
      });

      const hasPaidThisMonth = monthPayments.some(p => p.status === 'confirmed');

      console.log(`Payment created for tenant ${tenant_id}: $${payment.amount}, paid_this_month: ${hasPaidThisMonth}`);

      // Send confirmation email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: tenant_email,
        subject: 'Rent Payment Confirmation',
        body: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:32px auto;background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(124,111,205,0.15);">
          <h2 style="color:#1A1A2E;font-size:20px;font-weight:700;margin:0 0 12px;">Payment Confirmed</h2>
          <p style="color:#6B7280;font-size:14px;margin:0 0 20px;">Your rent payment of <strong style="color:#1A1A2E;font-size:16px;">$${(completedSession.amount_total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> has been successfully processed.</p>
          <div style="background:#F4F3FF;border-radius:12px;padding:16px;margin:20px 0;border-left:4px solid #7C6FCD;">
            <p style="color:#6B7280;font-size:13px;margin:0;"><strong style="color:#1A1A2E;">Transaction ID:</strong> ${session.id}</p>
            <p style="color:#6B7280;font-size:13px;margin:6px 0 0;"><strong style="color:#1A1A2E;">Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p style="color:#6B7280;font-size:12px;margin:20px 0 0;text-align:center;">Your receipt has been saved to your iTenant dashboard.</p>
        </div>`,
        from_name: 'iTenant Payments',
      });

      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: 'Webhook error' }, { status: 400 });
  }
});
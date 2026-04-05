import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { tenant_id, lease_id, tenant_email, tenant_name } = session.metadata || {};
    const amountPaid = session.amount_total / 100;
    const paymentDate = new Date().toISOString().split('T')[0];

    try {
      const base44 = createClientFromRequest(req);

      // Create a confirmed Payment record
      await base44.asServiceRole.entities.Payment.create({
        tenant_id: tenant_id || '',
        amount: amountPaid,
        method: 'card',
        status: 'confirmed',
        date: paymentDate,
        check_number: session.id,
      });

      console.log(`Payment recorded: $${amountPaid} for tenant ${tenant_id}`);

      // Send receipt email
      if (tenant_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: tenant_email,
          subject: `Rent Payment Receipt – $${amountPaid.toFixed(2)}`,
          body: `
Hi ${tenant_name || 'Tenant'},

Your rent payment of $${amountPaid.toFixed(2)} has been successfully received on ${paymentDate}.

Payment Reference: ${session.id}

Thank you for your payment!

— iTenant
          `.trim(),
        });
        console.log(`Receipt sent to ${tenant_email}`);
      }
    } catch (err) {
      console.error('Error processing payment event:', err.message);
      return new Response('Internal error', { status: 500 });
    }
  }

  return Response.json({ received: true });
});
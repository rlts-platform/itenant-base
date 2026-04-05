import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, amount, lease_id, tenant_email, tenant_name } = await req.json();

    if (!tenant_id || !amount) {
      return Response.json({ error: 'tenant_id and amount are required' }, { status: 400 });
    }

    const amountCents = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: tenant_email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Rent Payment',
            description: tenant_name ? `Payment from ${tenant_name}` : 'Monthly rent',
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.get('origin') || 'https://app.base44.com'}/tenant/pay?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.com'}/tenant/pay?canceled=1`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        tenant_id,
        lease_id: lease_id || '',
        tenant_email: tenant_email || '',
        tenant_name: tenant_name || '',
      },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createRentCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
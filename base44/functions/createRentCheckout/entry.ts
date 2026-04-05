import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = await import('npm:stripe@14.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, amount, lease_id, tenant_email, tenant_name } = await req.json();

    if (!tenant_id || !amount || !lease_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: tenant_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Monthly Rent Payment',
              description: `Rent payment from ${tenant_name}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${new URL(req.url).origin}/tenant/pay?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/tenant/pay?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        tenant_id,
        lease_id,
        tenant_email,
      },
    });

    console.log(`Checkout session created: ${session.id} for tenant ${tenant_id}`);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
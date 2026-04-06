import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PLAN_PRICES = {
  starter: 0,
  growth: 29,
  pro: 79,
  enterprise: 299,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { account_id, new_plan } = await req.json();
    if (!account_id || !new_plan) return Response.json({ error: 'Missing account_id or new_plan' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Fetch the account
    const accounts = await base44.asServiceRole.entities.Account.filter({ id: account_id });
    if (!accounts.length) return Response.json({ error: 'Account not found' }, { status: 404 });
    const account = accounts[0];

    const oldPlan = account.plan_tier || 'starter';
    const oldPrice = PLAN_PRICES[oldPlan] ?? 0;
    const newPrice = PLAN_PRICES[new_plan] ?? 0;

    // Calculate pro-rated amount
    let proratedAmount = 0;
    const today = new Date();
    const nextBillingDate = account.next_billing_date ? new Date(account.next_billing_date) : new Date(today.getTime() + 30 * 86400000);
    const daysRemaining = Math.max(0, Math.ceil((nextBillingDate - today) / 86400000));
    const daysInCycle = 30;

    if (newPrice > oldPrice && daysRemaining > 0) {
      const dailyDiff = (newPrice - oldPrice) / daysInCycle;
      proratedAmount = Math.round(dailyDiff * daysRemaining * 100); // cents
    }

    // If upgrading and there's a charge needed
    if (proratedAmount > 0) {
      // Check for payment method on file
      if (!account.stripe_customer_id) {
        return Response.json({ error: 'no_payment_method' }, { status: 402 });
      }

      // Check if customer has a default payment method
      let customer;
      try {
        customer = await stripe.customers.retrieve(account.stripe_customer_id, {
          expand: ['invoice_settings.default_payment_method'],
        });
      } catch (e) {
        console.error('Stripe customer retrieve error:', e.message);
        return Response.json({ error: 'no_payment_method' }, { status: 402 });
      }

      const paymentMethod = customer.invoice_settings?.default_payment_method;
      if (!paymentMethod) {
        return Response.json({ error: 'no_payment_method' }, { status: 402 });
      }

      // Charge the pro-rated amount
      try {
        await stripe.paymentIntents.create({
          amount: proratedAmount,
          currency: 'usd',
          customer: account.stripe_customer_id,
          payment_method: typeof paymentMethod === 'string' ? paymentMethod : paymentMethod.id,
          confirm: true,
          off_session: true,
          description: `Plan upgrade from ${oldPlan} to ${new_plan} (pro-rated)`,
          metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID'), account_id },
        });
      } catch (e) {
        console.error('Stripe charge error:', e.message);
        return Response.json({ error: 'payment_failed', message: e.message }, { status: 402 });
      }
    }

    // Calculate next billing date (30 days from today)
    const newNextBillingDate = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];

    // Update account
    await base44.asServiceRole.entities.Account.update(account_id, {
      plan_tier: new_plan,
      subscription_status: 'active',
      next_billing_date: newNextBillingDate,
    });

    return Response.json({
      success: true,
      prorated_amount: proratedAmount / 100,
      next_billing_date: newNextBillingDate,
    });
  } catch (error) {
    console.error('changePlan error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
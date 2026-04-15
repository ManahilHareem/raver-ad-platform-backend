import { Request, Response } from 'express';
import { stripe, STRIPE_CONFIG } from '../../config/stripe';
import * as billingService from './service';
import prisma from '../../db/prisma';

export const createCheckoutSession = async (req: any, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe service is not configured on the server.' });
    return;
  }
  try {
    const { planTier } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!['pro', 'enterprise'].includes(planTier)) {
      res.status(400).json({ error: 'Invalid plan tier' });
      return;
    }

    const customerId = await billingService.getOrCreateStripeCustomer(userId, email);

    // Placeholder Price IDs - in production these would come from env or database
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_ID_PRO || 'price_placeholder_pro',
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_placeholder_enterprise',
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceMap[planTier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId,
        planTier,
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe service is not configured on the server.' });
    return;
  }
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || req.body,
      sig as string,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const planTier = session.metadata.planTier || 'pro';
        
        await billingService.updateBillingFromStripe(customerId, {
          planTier,
          status: 'active',
        });
        console.log(`Checkout session completed for customer ${customerId}`);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        const planTier = status === 'active' ? 'pro' : 'free'; // Simplified logic

        await billingService.updateBillingFromStripe(customerId, {
          planTier,
          status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log(`Payment failed for invoice ${invoice.id}`);
        // Handle failed payment (e.g., notify user)
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

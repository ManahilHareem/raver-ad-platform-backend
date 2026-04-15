import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not defined. Stripe functionality will be disabled.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

export const STRIPE_CONFIG = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/billing/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/billing/cancel',
};

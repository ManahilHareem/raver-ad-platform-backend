import prisma from '../../db/prisma';
import { stripe } from '../../config/stripe';

const isValidUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const getSubscriptionPlan = async (userId: string) => {
  if (!isValidUuid(userId)) return { planTier: 'free', status: 'active' };
  try {
    const plan = await prisma.billing.findUnique({
      where: { userId }
    });
    
    if (!plan) {
      // If billing doesn't explicitly exist yet, standard default free
      return { planTier: 'free', status: 'active' };
    }
    return plan;
  } catch (error) {
    console.error(`Error fetching subscription plan for user ID (${userId}):`, error);
    throw new Error('Billing database query failed');
  }
};

export const updateSubscriptionPlan = async (userId: string, planTier: string) => {
  if (!isValidUuid(userId)) throw new Error('Invalid User ID format');
  try {
    return await prisma.billing.upsert({
      where: { userId },
      update: { planTier },
      create: { userId, planTier }
    });
  } catch (error) {
    console.error(`Error updating subscription plan for user ID (${userId}):`, error);
    throw new Error('Could not update billing record');
  }
};

export const addPaymentMethod = async (userId: string, data: any) => {
  if (!isValidUuid(userId)) throw new Error('Invalid User ID format');
  try {
    return await prisma.paymentMethod.create({
      data: {
        userId,
        cardHolderName: data.cardHolderName || data.cardholderName, // Match frontend lowercase 'h'
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        isDefault: data.isDefault || false
      }
    });
  } catch (error) {
    console.error(`Error adding payment method for user ID (${userId}):`, error);
    throw new Error('Payment method creation failed');
  }
};

export const updatePaymentMethod = async (id: string, userId: string, data: any) => {
  if (!isValidUuid(id) || !isValidUuid(userId)) throw new Error('Invalid ID format');
  try {
    return await prisma.paymentMethod.update({
      where: { id, userId },
      data: {
        cardHolderName: data.cardHolderName || data.cardholderName, // Match frontend lowercase 'h'
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        isDefault: data.isDefault
      }
    });
  } catch (error) {
    console.error(`Error updating payment method ID (${id}):`, error);
    throw new Error('Payment method update failed');
  }
};

export const getPaymentMethods = async (userId: string) => {
  if (!isValidUuid(userId)) return [];
  try {
    return await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(`Error fetching payment methods for user ID (${userId}):`, error);
    throw new Error('Could not retrieve payment methods');
  }
};

export const getOrCreateStripeCustomer = async (userId: string, email: string) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const billing = await prisma.billing.findUnique({ where: { userId } });
  
  if (billing?.stripeCustomerId) {
    return billing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.billing.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: { userId, stripeCustomerId: customer.id }
  });

  return customer.id;
};

export const updateBillingFromStripe = async (stripeCustomerId: string, data: { planTier: string; status: string; currentPeriodEnd?: Date }) => {
  const billing = await prisma.billing.findFirst({
    where: { stripeCustomerId }
  });

  if (!billing) {
    console.error(`No billing record found for Stripe Customer ID: ${stripeCustomerId}`);
    return;
  }

  return await prisma.billing.update({
    where: { id: billing.id },
    data: {
      planTier: data.planTier,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd
    }
  });
};

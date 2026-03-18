import prisma from '../../db/prisma';

const isValidUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export const getSubscriptionPlan = async (userId: string) => {
  if (!isValidUuid(userId)) return { planTier: 'free', status: 'active' };
  const plan = await prisma.billing.findUnique({
    where: { userId }
  });
  
  if (!plan) {
    // If billing doesn't explicitly exist yet, standard default free
    return { planTier: 'free', status: 'active' };
  }
  return plan;
};

export const updateSubscriptionPlan = async (userId: string, planTier: string) => {
  if (!isValidUuid(userId)) throw new Error('Invalid User ID format');
  return await prisma.billing.upsert({
    where: { userId },
    update: { planTier },
    create: { userId, planTier }
  });
};

export const addPaymentMethod = async (userId: string, data: any) => {
  if (!isValidUuid(userId)) throw new Error('Invalid User ID format');
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
};

export const updatePaymentMethod = async (id: string, userId: string, data: any) => {
  if (!isValidUuid(id) || !isValidUuid(userId)) throw new Error('Invalid ID format');
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
};

export const getPaymentMethods = async (userId: string) => {
  if (!isValidUuid(userId)) return [];
  return await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

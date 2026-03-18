// Resync TS server
export const getSubscription = async () => {
  // Mock data as Prisma model for Billing/Settings doesn't exist yet
  return {
    id: "mock-sub-123",
    planTier: "pro",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
};

export const addPaymentMethod = async (data: any) => {
  // Mock adding payment method
  return {
    id: "mock-pm-456",
    status: "added",
    last4: "4242"
  };
};

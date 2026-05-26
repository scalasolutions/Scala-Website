export interface SubscriptionClient {
  subscriptionStartDate: Date | null | string;
  subscriptionMonths: number | null;
}

// Helper to compute subscription remaining months
export function getSubscriptionRemainingMonths(client: SubscriptionClient) {
  if (!client.subscriptionStartDate || client.subscriptionMonths === null || client.subscriptionMonths === undefined) {
    return null;
  }
  const start = new Date(client.subscriptionStartDate);
  const now = new Date();
  
  // Calculate difference in months
  const yearDiff = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  const elapsedMonths = yearDiff * 12 + monthDiff;
  
  const remaining = client.subscriptionMonths - elapsedMonths;
  return Math.max(0, remaining);
}

// New pricing model: Commission-based with optional monthly subscription
// Free: 0₪/month, 17% commission
// Pro: 55₪/month, 15% commission  
// Scale: 83₪/month, 11% commission

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    nameHe: 'חינם',
    priceId: '', // No subscription needed
    amount: 0, // 0₪ per month
    currency: 'ILS',
    commissionRate: 0.17, // 17%
    features: {
      activeJourneys: -1, // unlimited
      includedUsers: -1, // unlimited
    }
  },
  pro: {
    name: 'Pro',
    nameHe: 'Pro',
    priceId: '',
    amount: 5500, // 55₪ in agorot
    currency: 'ILS',
    commissionRate: 0.15, // 15%
    features: {
      activeJourneys: -1, // unlimited
      includedUsers: -1, // unlimited
    }
  },
  scale: {
    name: 'Scale',
    nameHe: 'Scale',
    priceId: '',
    amount: 8300, // 83₪ in agorot
    currency: 'ILS',
    commissionRate: 0.11, // 11%
    features: {
      activeJourneys: -1, // unlimited
      includedUsers: -1, // unlimited
    }
  }
} as const;

// Calculate commission for a payment based on user's plan
// paymentAmount should be in the same unit as desired output (e.g., ILS or cents)
export function calculateCommission(paymentAmount: number, plan: PlanType): { 
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
} {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  const commissionRate = planDetails.commissionRate;
  const commissionAmount = Math.round(paymentAmount * commissionRate * 100) / 100; // Round to 2 decimal places
  const netAmount = Math.round((paymentAmount - commissionAmount) * 100) / 100;
  
  return {
    grossAmount: paymentAmount,
    commissionRate,
    commissionAmount,
    netAmount,
  };
}

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// Subscription service - Stripe not implemented at this stage
// Platform subscriptions will use LemonSqueezy when ready
export class SubscriptionService {
  async createSubscriptionCheckout(params: {
    userId: string;
    email: string;
    plan: PlanType;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
  }): Promise<{ url: string; sessionId: string }> {
    throw new Error('Subscription checkout not implemented. Platform subscriptions will use LemonSqueezy.');
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    throw new Error('Subscription management not implemented.');
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    throw new Error('Subscription cancellation not implemented.');
  }

  async reactivateSubscription(subscriptionId: string): Promise<any> {
    throw new Error('Subscription reactivation not implemented.');
  }

  async changePlan(subscriptionId: string, newPlan: PlanType): Promise<any> {
    throw new Error('Plan change not implemented.');
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    throw new Error('Customer portal not implemented.');
  }

  async handleSubscriptionWebhook(event: any): Promise<any> {
    throw new Error('Subscription webhook not implemented.');
  }
}

export const subscriptionService = new SubscriptionService();

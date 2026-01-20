import { getUncachableStripeClient } from './stripeClient';
import Stripe from 'stripe';

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

export class SubscriptionService {
  private async getOrCreateProduct(stripe: Stripe): Promise<string> {
    const products = await stripe.products.list({ active: true, limit: 100 });
    const existingProduct = products.data.find(p => p.name === 'Flow 83 Subscription');
    
    if (existingProduct) {
      return existingProduct.id;
    }
    
    const product = await stripe.products.create({
      name: 'Flow 83 Subscription',
      description: 'Monthly subscription to Flow 83 platform',
    });
    
    return product.id;
  }

  private async getOrCreatePrice(stripe: Stripe, productId: string, plan: PlanType): Promise<string> {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    const prices = await stripe.prices.list({ 
      product: productId, 
      active: true,
      limit: 100 
    });
    
    const existingPrice = prices.data.find(p => 
      p.unit_amount === planDetails.amount && 
      p.recurring?.interval === 'month' &&
      p.metadata?.plan === plan
    );
    
    if (existingPrice) {
      return existingPrice.id;
    }
    
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: planDetails.amount,
      currency: planDetails.currency.toLowerCase(),
      recurring: { interval: 'month' },
      metadata: { plan },
    });
    
    return price.id;
  }

  async createSubscriptionCheckout(params: {
    userId: string;
    email: string;
    plan: PlanType;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
  }): Promise<{ url: string; sessionId: string }> {
    const stripe = await getUncachableStripeClient();
    const planDetails = SUBSCRIPTION_PLANS[params.plan];
    
    const productId = await this.getOrCreateProduct(stripe);
    const priceId = await this.getOrCreatePrice(stripe, productId, params.plan);
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        plan: params.plan,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      },
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else {
      sessionParams.customer_email = params.email;
    }

    // No trial periods in new pricing model - all plans are commission-based

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return {
      url: session.url!,
      sessionId: session.id,
    };
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async changePlan(subscriptionId: string, newPlan: PlanType): Promise<Stripe.Subscription> {
    const stripe = await getUncachableStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const productId = await this.getOrCreateProduct(stripe);
    const newPriceId = await this.getOrCreatePrice(stripe, productId, newPlan);
    
    // Update the subscription to the new price
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      metadata: {
        ...subscription.metadata,
        plan: newPlan,
      },
      proration_behavior: 'create_prorations', // Prorate the difference
    });
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async handleSubscriptionWebhook(event: Stripe.Event): Promise<{
    userId: string;
    subscriptionId: string;
    customerId: string;
    plan: PlanType;
    status: string;
    trialEnd?: Date;
    currentPeriodEnd?: Date;
  } | null> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') return null;
        
        return {
          userId: session.metadata?.userId || '',
          subscriptionId: session.subscription as string,
          customerId: session.customer as string,
          plan: (session.metadata?.plan || 'starter') as PlanType,
          status: 'active',
        };
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const subData = subscription as any;
        
        return {
          userId: subscription.metadata?.userId || '',
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          plan: (subscription.metadata?.plan || 'starter') as PlanType,
          status,
          trialEnd: subData.trial_end ? new Date(subData.trial_end * 1000) : undefined,
          currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : undefined,
        };
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        return {
          userId: subscription.metadata?.userId || '',
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          plan: (subscription.metadata?.plan || 'starter') as PlanType,
          status: 'canceled',
        };
      }
      
      default:
        return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();

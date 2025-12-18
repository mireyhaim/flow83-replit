import { getUncachableStripeClient, getStripeSecretKey } from './stripeClient';
import { db } from './db';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createConnectAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  async createConnectAccount(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { userId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  async getConnectAccount(accountId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.retrieve(accountId);
  }

  async createConnectedCheckoutSession(params: {
    connectedAccountId: string;
    customerEmail?: string;
    amount: number;
    currency: string;
    productName: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    applicationFeePercent?: number;
  }) {
    const stripe = await getUncachableStripeClient();
    const applicationFee = params.applicationFeePercent 
      ? Math.round(params.amount * (params.applicationFeePercent / 100))
      : 0;

    return await stripe.checkout.sessions.create({
      customer_email: params.customerEmail,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency,
          product_data: {
            name: params.productName,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      payment_intent_data: applicationFee > 0 ? {
        application_fee_amount: applicationFee,
      } : undefined,
    }, {
      stripeAccount: params.connectedAccountId,
    });
  }

  async getConnectedCheckoutSession(sessionId: string, connectedAccountId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      stripeAccount: connectedAccountId,
    });
  }

  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.customerEmail,
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });
  }

  async createOneTimePaymentSession(params: {
    customerEmail?: string;
    amount: number;
    currency: string;
    productName: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer_email: params.customerEmail,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency,
          product_data: {
            name: params.productName,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });
  }

  async getPaymentIntent(paymentIntentId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.payment_intents WHERE id = ${paymentIntentId}`
    );
    return result.rows[0] || null;
  }

  async getCheckoutSession(sessionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId);
  }
}

export const stripeService = new StripeService();

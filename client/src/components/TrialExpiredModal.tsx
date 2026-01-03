import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysOverdue?: number;
}

export function TrialExpiredModal({ isOpen, onClose, daysOverdue = 0 }: TrialExpiredModalProps) {
  const { t, i18n } = useTranslation(['dashboard', 'landing']);
  const isHebrew = i18n.language === 'he';

  const handleSubscribe = (planId: string) => {
    // Different checkout URLs based on language
    // Hebrew users go to Grow, English users go to LemonSqueezy
    const lemonSqueezyUrls: Record<string, string> = {
      starter: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
      pro: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
      business: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
    };
    // Grow URLs will be configured when provided by user
    const growUrls: Record<string, string> = {
      starter: 'https://pay.grow.link/345b96922ae5b62bf5b91c8a4828a3bc-MjkyNzAzNQ',
      pro: '',
      business: '',
    };
    
    const checkoutUrls = isHebrew ? growUrls : lemonSqueezyUrls;
    const baseUrl = checkoutUrls[planId] || lemonSqueezyUrls[planId];
    
    if (!baseUrl) {
      // If Grow URL not configured yet, show message
      alert(t('subscription.paymentNotConfigured', 'Payment link not configured yet. Please contact support.'));
      return;
    }
    
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
    window.open(`${baseUrl}&checkout[redirect_url]=${returnUrl}`, '_blank');
  };

  const prices = isHebrew 
    ? { starter: '₪83', pro: '₪183', business: '₪283' }
    : { starter: '$26', pro: '$83', business: '$188' };

  const plans = [
    { id: 'starter', name: t('subscription.starter', 'Starter'), price: prices.starter, flows: '1', users: '60' },
    { id: 'pro', name: t('subscription.pro', 'Pro'), price: prices.pro, flows: '5', users: '300', popular: true },
    { id: 'business', name: t('subscription.business', 'Business'), price: prices.business, flows: '10', users: '1000' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('trialExpired.title', 'Trial Period Ended')}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-center text-base">
            {t('trialExpired.description', 'Your 21-day free trial has ended. Subscribe now to continue using Flow83 and keep your flows active.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <h4 className="font-medium text-orange-300 mb-2">{t('trialExpired.whatsAffected', "What's affected:")}</h4>
            <ul className="text-sm text-white/70 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                {t('trialExpired.flowsUnpublished', 'Your published flows are now hidden')}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                {t('trialExpired.cantEdit', "You can't edit or create new flows")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">•</span>
                {t('trialExpired.participantsCantJoin', "New participants can't join")}
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-xl p-4 cursor-pointer transition-all ${
                  plan.popular 
                    ? 'bg-violet-500/20 border-2 border-violet-500 ring-1 ring-violet-500/50' 
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
                onClick={() => handleSubscribe(plan.id)}
              >
                {plan.popular && (
                  <div className="text-xs font-medium text-violet-300 mb-2">{t('subscription.popular', 'Most Popular')}</div>
                )}
                <div className="font-semibold text-white mb-1">{plan.name}</div>
                <div className="flex items-baseline mb-3">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50 text-sm ms-1">{t('subscription.perMonth', '/mo')}</span>
                </div>
                <div className="text-xs text-white/60 space-y-1">
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-violet-400" />
                    <span>{plan.flows} {t('subscription.flows', 'Flow(s)')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-violet-400" />
                    <span>{plan.users} {t('subscription.users', 'users')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => handleSubscribe('starter')}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 h-12 text-base"
            data-testid="button-subscribe-now"
          >
            <Crown className="w-5 h-5 me-2" />
            {t('trialExpired.subscribeNow', 'Subscribe Now')}
          </Button>

          <div className="text-center">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white/70 underline">
              {t('trialExpired.viewFullPricing', 'View full pricing details')}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysOverdue?: number;
}

export function TrialExpiredModal({ isOpen, onClose, daysOverdue = 0 }: TrialExpiredModalProps) {
  const { t } = useTranslation(['dashboard']);

  const handleSubscribe = () => {
    const baseUrl = 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
    window.open(`${baseUrl}&checkout[redirect_url]=${returnUrl}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md">
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

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-violet-300">{t('subscription.starter', 'Starter')}</span>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-white">$26</span>
                <span className="text-white/50 ms-1">{t('subscription.perMonth', '/month')}</span>
              </div>
            </div>
            <p className="text-sm text-white/60">
              {t('trialExpired.subscribeToRestore', 'Subscribe to restore all your flows and continue growing your business.')}
            </p>
          </div>

          <Button
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 h-12 text-base"
            data-testid="button-subscribe-now"
          >
            <Crown className="w-5 h-5 me-2" />
            {t('trialExpired.subscribeNow', 'Subscribe Now')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

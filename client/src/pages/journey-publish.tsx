import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, ArrowRight, Check, CreditCard, Rocket, 
  Copy, ExternalLink, Loader2, Lock, Crown, ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { journeyApi } from "@/lib/api";
import type { Journey } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

const JourneyPublishPage = () => {
  const { t, i18n } = useTranslation('dashboard');
  const isHebrew = i18n.language === 'he';
  const [match, params] = useRoute("/journey/:id/publish");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingUser } = useAuth();

  const [journeyData, setJourneyData] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [publishPrice, setPublishPrice] = useState("");
  const [externalPaymentUrl, setExternalPaymentUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showOtherPayment, setShowOtherPayment] = useState(false);
  const [growPaymentUrl, setGrowPaymentUrl] = useState("");
  const [otherPaymentUrl, setOtherPaymentUrl] = useState("");

  const subscriptionStatus = user?.subscriptionStatus;
  const hasActiveSubscription = subscriptionStatus === "active" || subscriptionStatus === "trialing" || subscriptionStatus === "on_trial";
  const isLoadingSubscription = isLoadingUser;

  const hasRefreshedUser = useRef(false);
  useEffect(() => {
    if (!hasRefreshedUser.current) {
      hasRefreshedUser.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  }, [queryClient]);

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) return;
      try {
        const data = await journeyApi.getFull(params.id);
        setJourneyData(data);
        setPublishPrice(data.price?.toString() || "0");
        const existingPaymentUrl = data.externalPaymentUrl || "";
        setExternalPaymentUrl(existingPaymentUrl);
        const isGrow = existingPaymentUrl.includes('grow.link') || existingPaymentUrl.includes('grow.website') || existingPaymentUrl.includes('meshulam') || existingPaymentUrl.includes('grow.business');
        if (isGrow) {
          setGrowPaymentUrl(existingPaymentUrl);
          setOtherPaymentUrl("");
        } else if (existingPaymentUrl) {
          setOtherPaymentUrl(existingPaymentUrl);
          setGrowPaymentUrl("");
          setShowOtherPayment(true);
        }
      } catch (error) {
        toast({
          title: t('error'),
          description: t('failedToLoadFlow'),
          variant: "destructive",
        });
        setLocation('/journeys');
      } finally {
        setIsLoading(false);
      }
    };
    loadJourney();
  }, [params?.id]);

  const handleConfirmPublish = async () => {
    if (!journeyData) return;
    setIsPublishing(true);
    
    const priceValue = parseFloat(publishPrice) || 0;
    
    try {
      const updatedJourney = await journeyApi.update(journeyData.id, { 
        status: "published",
        price: priceValue,
        currency: isHebrew ? "ILS" : "USD",
        externalPaymentUrl: externalPaymentUrl || null,
      });
      setJourneyData(prev => prev ? { ...prev, ...updatedJourney } : null);
      setCurrentStep(4);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      if (errorMsg.includes("subscription_required") || errorMsg.startsWith("402:")) {
        setLocation(`/journey/${journeyData.id}/edit?showPaywall=true`);
      } else {
        toast({
          title: t('error'),
          description: t('failedToPublishFlow'),
          variant: "destructive",
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const getShareableLink = () => {
    if (!journeyData) return "";
    if (journeyData.shortCode) {
      return `${window.location.origin}/f/${journeyData.shortCode}`;
    }
    return `${window.location.origin}/j/${journeyData.id}`;
  };

  const handleCopyLink = async () => {
    const link = getShareableLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: t('error'),
        description: t('failedToCopyLink'),
        variant: "destructive",
      });
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep && currentStep !== 4) {
      setCurrentStep(step);
    }
  };

  const isPaid = (parseFloat(publishPrice) || 0) > 0;

  if (isLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-600 mx-auto flex items-center justify-center mb-8">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{t('subscription.choosePlanTitle')}</h1>
          <p className="text-white/50 mb-10 leading-relaxed">{t('subscription.choosePlanDescription')}</p>
          <Button
            onClick={() => setLocation('/pricing')}
            className="w-full bg-violet-600 hover:bg-violet-700 h-14 text-lg font-medium mb-4"
            data-testid="button-view-plans"
          >
            <Crown className="w-5 h-5 mx-2" />
            {t('viewPlans')}
          </Button>
          <button
            onClick={() => setLocation(`/journey/${params?.id}/edit`)}
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
            data-testid="button-back-to-editor"
          >
            <ArrowLeft className="w-4 h-4 inline mx-1" />
            {t('journeySettings.backToEditor')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-4">{t('flowNotFound')}</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-back" className="bg-violet-600 hover:bg-violet-700">
            {t('backToFlows')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a12] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link 
          href={`/journey/${journeyData.id}/edit`} 
          className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-2"
          data-testid="link-back-to-editor"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('journeySettings.backToEditor')}</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => handleStepClick(step)}
              disabled={step >= currentStep || currentStep === 4}
              className={`h-2 rounded-full transition-all ${
                step === currentStep 
                  ? 'w-6 bg-violet-500' 
                  : step < currentStep 
                    ? 'w-2 bg-violet-500 cursor-pointer hover:bg-violet-400' 
                    : 'w-2 bg-white/20'
              } ${step < currentStep && currentStep !== 4 ? 'cursor-pointer' : ''}`}
              data-testid={`step-indicator-${step}`}
            />
          ))}
        </div>
        
        <div className="w-20" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-white mb-3">
                  {t('publishModal.step1Title')}
                </h1>
                <p className="text-white/50 mb-10">
                  {t('publishModal.step1Description')}
                </p>

                <div className="relative mb-6">
                  <Input
                    type="number"
                    min="0"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(e.target.value)}
                    placeholder="0"
                    className="bg-white/5 border-white/10 focus:border-violet-500 text-white text-5xl text-center h-24 rounded-2xl"
                    data-testid="input-publish-price"
                  />
                  <span className="absolute end-5 top-1/2 -translate-y-1/2 text-white/30 text-2xl">
                    {t('publishModal.currencySymbol')}
                  </span>
                </div>

                <p className="text-white/40 text-sm mb-10">
                  {publishPrice === "0" || publishPrice === "" 
                    ? t('publishModal.freeDescription') 
                    : t('publishModal.paidDescription', { price: publishPrice })}
                </p>

                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-violet-600 hover:bg-violet-700 h-14 text-lg font-medium"
                  data-testid="button-next-step"
                >
                  {t('publishModal.continue')}
                  <ArrowRight className="w-5 h-5 mx-2" />
                </Button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-white mb-3">
                  {t('publishModal.step2Title')}
                </h1>
                <p className="text-white/50 mb-8">
                  {isPaid ? t('publishModal.step2DescriptionPaid') : t('publishModal.step2DescriptionFree')}
                </p>

                {isPaid ? (
                  <div className="space-y-4 mb-8 text-start">
                    <div 
                      className={`rounded-2xl p-5 border transition-all ${
                        growPaymentUrl || (!externalPaymentUrl && !showOtherPayment) 
                          ? 'bg-violet-600/10 border-violet-500/50' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{t('publishModal.connectToGrow')}</h3>
                          <p className="text-xs text-violet-400">{t('publishModal.growRecommended')}</p>
                        </div>
                      </div>
                      
                      <Input
                        type="url"
                        value={growPaymentUrl}
                        onChange={(e) => {
                          setGrowPaymentUrl(e.target.value);
                          setOtherPaymentUrl("");
                          setExternalPaymentUrl(e.target.value);
                        }}
                        placeholder={t('publishModal.growLinkPlaceholder')}
                        className="bg-white/5 border-white/10 focus:border-violet-500 text-white h-12 rounded-xl mb-3"
                        data-testid="input-grow-payment-url"
                      />
                      
                      <button
                        onClick={() => window.open('https://grow.website/', '_blank')}
                        className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t('publishModal.openGrow')}
                      </button>
                    </div>

                    <div 
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        otherPaymentUrl ? 'bg-violet-600/10 border-violet-500/50' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => setShowOtherPayment(!showOtherPayment)}
                        className="w-full p-4 flex items-center justify-between text-white/60 hover:bg-white/5 transition-colors"
                        data-testid="button-toggle-other-payment"
                      >
                        <span className="font-medium">{t('publishModal.otherPaymentOption')}</span>
                        {showOtherPayment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      <AnimatePresence>
                        {showOtherPayment && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <p className="text-sm text-white/40 mb-3">{t('publishModal.otherPaymentDescription')}</p>
                            <Input
                              type="url"
                              value={otherPaymentUrl}
                              onChange={(e) => {
                                setOtherPaymentUrl(e.target.value);
                                setGrowPaymentUrl("");
                                setExternalPaymentUrl(e.target.value);
                              }}
                              placeholder={t('publishModal.otherPaymentPlaceholder')}
                              className="bg-white/5 border-white/10 focus:border-violet-500 text-white h-12 rounded-xl"
                              data-testid="input-other-payment-url"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {!externalPaymentUrl && (
                      <p className="text-amber-400/80 text-sm text-center">
                        {t('publishModal.enterPaymentLink')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-5 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <p className="text-white/70">{t('publishModal.freeFlowNote')}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mx-1" />
                    {t('publishModal.back')}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 font-medium disabled:opacity-40"
                    data-testid="button-next-after-payment"
                    disabled={isPaid && !externalPaymentUrl}
                  >
                    {t('publishModal.continue')}
                    <ArrowRight className="w-5 h-5 mx-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-white mb-3">
                  {t('publishModal.step3Title')}
                </h1>
                <p className="text-white/50 mb-8">
                  {t('publishModal.step3Description')}
                </p>

                <div className="bg-white/5 rounded-2xl p-5 mb-8 text-start space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/50">{t('publishModal.flowName')}</span>
                    <span className="text-white font-medium">{journeyData.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/50">{t('publishModal.price')}</span>
                    <span className="text-white font-medium">
                      {isPaid ? `${publishPrice} ${t('publishModal.currencySymbol')}` : t('publishModal.free')}
                    </span>
                  </div>
                  {isPaid && externalPaymentUrl && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/50">{t('publishModal.paymentLink')}</span>
                      <span className="text-violet-400 text-sm truncate max-w-[180px]">{externalPaymentUrl}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-back-confirm"
                  >
                    <ArrowLeft className="w-4 h-4 mx-1" />
                    {t('publishModal.back')}
                  </Button>
                  <Button
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 font-medium"
                    data-testid="button-publish"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mx-2" />
                        {t('publishModal.publishNow')}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500 mx-auto flex items-center justify-center mb-8"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>

                <h1 className="text-3xl font-bold text-white mb-3">
                  {t('publishModal.successTitle')}
                </h1>
                <p className="text-white/50 mb-8">
                  {t('publishModal.successDescription')}
                </p>

                <div className="bg-white/5 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={getShareableLink()}
                      className="flex-1 bg-transparent text-white/70 text-sm outline-none"
                      data-testid="text-shareable-link"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                      data-testid="button-copy-link"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCopyLink}
                    className="w-full bg-violet-600 hover:bg-violet-700 h-14 font-medium"
                    data-testid="button-copy-and-share"
                  >
                    <Copy className="w-5 h-5 mx-2" />
                    {copiedLink ? t('publishModal.linkCopied') : t('publishModal.copyLink')}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => setLocation('/journeys')}
                    className="w-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white h-12"
                    data-testid="button-back-to-flows"
                  >
                    {t('publishModal.backToFlows')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default JourneyPublishPage;

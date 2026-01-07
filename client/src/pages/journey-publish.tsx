import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Check, CreditCard, Rocket, 
  CheckCircle, Copy, ExternalLink, Loader2, Sparkles,
  ChevronDown, ChevronUp, Lock, Crown, Coins, Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { journeyApi } from "@/lib/api";
import type { Journey } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel, GradientHeader, StepIndicator } from "@/components/ui/glass-panel";

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

  const steps = [
    { id: 1, label: t('publishModal.stepPrice') },
    { id: 2, label: t('publishModal.stepPayment') },
    { id: 3, label: t('publishModal.stepCreate') },
    { id: 4, label: t('publishModal.stepShare') },
  ];

  if (isLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-violet-600/30">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <p className="text-white/60 text-lg">{t('loadingFlow')}</p>
        </motion.div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md relative z-10"
        >
          <GlassPanel variant="highlight" padding="lg" className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-violet-600/30">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{t('subscription.choosePlanTitle')}</h1>
            <p className="text-white/60 mb-8">{t('subscription.choosePlanDescription')}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setLocation('/pricing')}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-14 text-lg font-medium shadow-lg shadow-violet-600/25"
                data-testid="button-view-plans"
              >
                <Crown className="w-5 h-5 mx-2" />
                {t('viewPlans')}
              </Button>
              <button
                onClick={() => setLocation(`/journey/${params?.id}/edit`)}
                className="text-white/50 hover:text-white text-sm py-3 transition-colors"
                data-testid="button-back-to-editor"
              >
                <ArrowLeft className="w-4 h-4 inline mx-2" />
                {t('journeySettings.backToEditor')}
              </button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        <GlassPanel className="text-center max-w-md relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">{t('flowNotFound')}</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-back" className="bg-violet-600 hover:bg-violet-700">
            {t('backToFlows')}
          </Button>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] relative overflow-hidden">
      <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 end-1/3 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative z-10">
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-16">
              <Link 
                href={`/journey/${journeyData.id}/edit`} 
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                data-testid="link-back-to-editor"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">{t('journeySettings.backToEditor')}</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-white">{t('publishFlow')}</h1>
              </div>
              <div className="w-24" />
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-10 md:mb-12">
            <StepIndicator 
              steps={steps} 
              currentStep={currentStep} 
              onStepClick={(id) => id < currentStep && setCurrentStep(id)}
            />
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GlassPanel variant="highlight" padding="md" className="text-center">
                  <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-3" />
                  <p className="text-white/90">{t('publishModal.introMessage')}</p>
                </GlassPanel>

                <GradientHeader
                  icon={<Coins className="w-full h-full" />}
                  title={t('publishModal.step1Title')}
                  subtitle={t('publishModal.step1Description')}
                  size="lg"
                />

                <GlassPanel variant="subtle" className="space-y-4">
                  <h4 className="font-medium text-violet-300">{t('publishModal.whySetPrice')}</h4>
                  <p className="text-sm text-white/60">{t('publishModal.whySetPriceText')}</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-violet-400" />
                      </div>
                      <span className="text-sm text-white/70">{t('publishModal.freeOption')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-violet-400" />
                      </div>
                      <span className="text-sm text-white/70">{t('publishModal.paidOption')}</span>
                    </div>
                  </div>
                </GlassPanel>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={publishPrice}
                      onChange={(e) => setPublishPrice(e.target.value)}
                      placeholder="0"
                      className="bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white text-5xl text-center h-28 rounded-2xl transition-colors"
                      data-testid="input-publish-price"
                    />
                    <span className="absolute end-6 top-1/2 -translate-y-1/2 text-white/40 text-3xl font-light">
                      {t('publishModal.currencySymbol')}
                    </span>
                  </div>
                  <p className="text-white/50 text-center">
                    {publishPrice === "0" || publishPrice === "" 
                      ? t('publishModal.freeDescription') 
                      : t('publishModal.paidDescription', { price: publishPrice })}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation(`/journey/${journeyData.id}/edit`)}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-cancel"
                  >
                    {t('publishModal.cancel')}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-14 text-lg font-medium shadow-lg shadow-violet-600/25"
                    data-testid="button-next-step"
                  >
                    {t('publishModal.continue')}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GradientHeader
                  icon={<CreditCard className="w-full h-full" />}
                  title={t('publishModal.step2Title')}
                  subtitle={(parseFloat(publishPrice) || 0) > 0 
                    ? t('publishModal.step2DescriptionPaid')
                    : t('publishModal.step2DescriptionFree')}
                  size="lg"
                />

                {(parseFloat(publishPrice) || 0) > 0 ? (
                  <div className="space-y-4">
                    <GlassPanel 
                      variant={growPaymentUrl || (!externalPaymentUrl && !showOtherPayment) ? "highlight" : "default"} 
                      className="relative"
                    >
                      <div className="absolute -top-3 end-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                        {t('publishModal.growRecommended')}
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white text-lg">{t('publishModal.connectToGrow')}</h4>
                      </div>
                      <p className="text-sm text-white/60 mb-5">{t('publishModal.growDescription')}</p>
                      <ul className="text-sm text-white/50 space-y-2 mb-6">
                        {[t('publishModal.growFeature1'), t('publishModal.growFeature2'), t('publishModal.growFeature3')].map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="space-y-4">
                        <Button
                          onClick={() => window.open('https://grow.website/', '_blank')}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 h-12 font-medium shadow-lg shadow-emerald-500/20"
                          data-testid="button-open-grow"
                        >
                          <ExternalLink className="w-4 h-4 mx-2" />
                          {t('publishModal.openGrow')}
                        </Button>
                        
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-sm text-white/50 mb-3 text-center">{t('publishModal.haveGrowAccount')}</p>
                          <Input
                            type="url"
                            value={growPaymentUrl}
                            onChange={(e) => {
                              setGrowPaymentUrl(e.target.value);
                              setOtherPaymentUrl("");
                              setExternalPaymentUrl(e.target.value);
                            }}
                            placeholder={t('publishModal.growLinkPlaceholder')}
                            className="bg-white/5 border-white/10 hover:border-emerald-500/50 focus:border-emerald-500 text-white h-12 rounded-xl transition-colors"
                            data-testid="input-grow-payment-url"
                          />
                        </div>
                      </div>
                    </GlassPanel>

                    <GlassPanel 
                      variant={otherPaymentUrl ? "highlight" : "subtle"} 
                      padding="none"
                      className="overflow-hidden"
                    >
                      <button
                        onClick={() => setShowOtherPayment(!showOtherPayment)}
                        className="w-full p-5 flex items-center justify-between text-white/60 hover:bg-white/5 transition-colors"
                        data-testid="button-toggle-other-payment"
                      >
                        <span className="font-medium">{t('publishModal.otherPaymentOption')}</span>
                        {(showOtherPayment || otherPaymentUrl) 
                          ? <ChevronUp className="w-5 h-5" /> 
                          : <ChevronDown className="w-5 h-5" />}
                      </button>
                      
                      <AnimatePresence>
                        {(showOtherPayment || otherPaymentUrl) && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-5 pb-5 space-y-3"
                          >
                            <p className="text-sm text-white/40">{t('publishModal.otherPaymentDescription')}</p>
                            <Input
                              type="url"
                              value={otherPaymentUrl}
                              onChange={(e) => {
                                setOtherPaymentUrl(e.target.value);
                                setGrowPaymentUrl("");
                                setExternalPaymentUrl(e.target.value);
                              }}
                              placeholder={t('publishModal.otherPaymentPlaceholder')}
                              className="bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white h-12 rounded-xl transition-colors"
                              data-testid="input-other-payment-url"
                            />
                            <p className="text-xs text-white/30">{t('publishModal.paymentRedirectNote')}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassPanel>

                    {!externalPaymentUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <GlassPanel className="bg-amber-500/10 border-amber-500/20">
                          <p className="text-sm text-amber-300 text-center">{t('publishModal.enterPaymentLink')}</p>
                        </GlassPanel>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <GlassPanel variant="highlight">
                    <p className="text-white/70 text-center">{t('publishModal.freeFlowNote')}</p>
                  </GlassPanel>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mx-2" />
                    {t('publishModal.back')}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-14 text-lg font-medium shadow-lg shadow-violet-600/25 disabled:opacity-50"
                    data-testid="button-next-after-payment"
                    disabled={(parseFloat(publishPrice) || 0) > 0 && !externalPaymentUrl}
                  >
                    {(parseFloat(publishPrice) || 0) === 0 
                      ? t('publishModal.skipAndContinue') 
                      : externalPaymentUrl 
                        ? t('publishModal.nextStep') 
                        : t('publishModal.setupRequired')}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <GradientHeader
                  icon={<Rocket className="w-full h-full" />}
                  title={t('publishModal.step3Title')}
                  subtitle={t('publishModal.step3Description')}
                  size="lg"
                />

                <GlassPanel variant="subtle" className="space-y-4">
                  <h4 className="font-medium text-violet-300">{t('publishModal.whatIsMiniSite')}</h4>
                  <p className="text-sm text-white/60">{t('publishModal.miniSiteExplanation')}</p>
                  <div className="space-y-2">
                    {[t('publishModal.miniSiteFeature1'), t('publishModal.miniSiteFeature2'), t('publishModal.miniSiteFeature3')].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-violet-400" />
                        </div>
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </GlassPanel>

                <GlassPanel className="space-y-0">
                  <h4 className="font-medium text-white mb-4">{t('publishModal.flowSummary')}</h4>
                  <div className="divide-y divide-white/10">
                    <div className="flex justify-between items-center py-4">
                      <span className="text-white/50">{t('publishModal.flowName')}</span>
                      <span className="text-white font-medium">{journeyData.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-white/50">{t('publishModal.duration')}</span>
                      <span className="text-white font-medium">{t('publishModal.daysCount', { count: journeyData.duration || 7 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="text-white/50">{t('publishModal.price')}</span>
                      <span className="text-white font-semibold text-xl">
                        {(parseFloat(publishPrice) || 0) === 0 
                          ? t('free') 
                          : `${t('publishModal.currencySymbol')}${publishPrice}`}
                      </span>
                    </div>
                  </div>
                </GlassPanel>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-back-step3"
                  >
                    <ArrowLeft className="w-4 h-4 mx-2" />
                    {t('publishModal.back')}
                  </Button>
                  <Button
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 h-16 text-lg font-bold shadow-xl shadow-emerald-500/25"
                    data-testid="button-publish-now"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-6 h-6 mx-2" />
                        {t('publishModal.createAndPublish')}
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
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-3"
                  >
                    {t('publishModal.step4Title')}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/60 text-lg"
                  >
                    {t('publishModal.step4Description')}
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  <GlassPanel variant="highlight" className="text-center">
                    <Share2 className="w-6 h-6 text-violet-400 mx-auto mb-3" />
                    <p className="text-white/70 text-sm mb-3">{t('publishModal.shareableLink')}</p>
                    <p className="text-lg text-white font-mono break-all bg-black/20 rounded-xl p-4">
                      {getShareableLink()}
                    </p>
                  </GlassPanel>

                  <Button
                    onClick={handleCopyLink}
                    className={`w-full h-14 text-lg font-medium transition-all ${
                      copiedLink 
                        ? 'bg-emerald-600 hover:bg-emerald-600' 
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 shadow-lg shadow-violet-600/25'
                    }`}
                    data-testid="button-copy-link-action"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-5 h-5 mx-2" />
                        {t('publishModal.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mx-2" />
                        {t('publishModal.copyLink')}
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4"
                >
                  <Button
                    onClick={() => setLocation('/journeys')}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-14 text-lg font-medium shadow-lg shadow-violet-600/25"
                    data-testid="button-to-journeys"
                  >
                    <Check className="w-5 h-5 mx-2" />
                    {t('publishModal.done')}
                  </Button>
                  
                  <button
                    onClick={() => setLocation(`/journey/${journeyData.id}/edit`)}
                    className="w-full text-white/40 hover:text-white/70 text-sm py-4 transition-colors"
                    data-testid="button-back-to-editor-final"
                  >
                    {t('journeySettings.backToEditor')}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default JourneyPublishPage;

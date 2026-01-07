import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Check, CreditCard, Rocket, 
  CheckCircle, Copy, ExternalLink, Loader2, Sparkles,
  ChevronDown, ChevronUp, Lock, Crown
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

  const steps = [
    { id: 1, label: t('publishModal.stepPrice') },
    { id: 2, label: t('publishModal.stepPayment') },
    { id: 3, label: t('publishModal.stepCreate') },
    { id: 4, label: t('publishModal.stepShare') },
  ];

  if (isLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-white/60">{t('loadingFlow')}</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{t('subscription.choosePlanTitle')}</h1>
          <p className="text-white/60 mb-8">{t('subscription.choosePlanDescription')}</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation('/pricing')}
              className="bg-violet-600 hover:bg-violet-700 h-14 text-lg"
              data-testid="button-view-plans"
            >
              <Crown className="w-5 h-5 mx-2" />
              {t('viewPlans')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation(`/journey/${params?.id}/edit`)}
              className="text-white/60 hover:text-white"
              data-testid="button-back-to-editor"
            >
              <ArrowLeft className="w-4 h-4 mx-2" />
              {t('journeySettings.backToEditor')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{t('flowNotFound')}</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-back">
            {t('backToFlows')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <header className="bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link 
              href={`/journey/${journeyData.id}/edit`} 
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              data-testid="link-back-to-editor"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('journeySettings.backToEditor')}</span>
            </Link>
            <h1 className="text-lg font-semibold text-white">{t('publishFlow')}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    currentStep > step.id 
                      ? 'bg-emerald-500 text-white' 
                      : currentStep === step.id 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                        : 'bg-white/10 text-white/50'
                  }`}
                  animate={{ scale: currentStep === step.id ? 1.1 : 1 }}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </motion.div>
                <span className={`text-xs ${currentStep >= step.id ? 'text-white' : 'text-white/50'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mt-[-20px] mx-2 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-2xl p-6 text-center">
                <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-3" />
                <p className="text-white/90">{t('publishModal.introMessage')}</p>
              </div>

              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-3">{t('publishModal.step1Title')}</h2>
                <p className="text-white/60 text-lg">{t('publishModal.step1Description')}</p>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
                <h4 className="font-medium text-violet-300 mb-3">{t('publishModal.whySetPrice')}</h4>
                <p className="text-sm text-white/70 mb-4">{t('publishModal.whySetPriceText')}</p>
                <ul className="text-sm text-white/70 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{t('publishModal.freeOption')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{t('publishModal.paidOption')}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <Label className="text-white/80 text-lg">{t('publishModal.priceLabel')}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(e.target.value)}
                    placeholder={t('publishModal.pricePlaceholder')}
                    className="bg-white/5 border-white/20 text-white text-4xl text-center h-24 rounded-2xl"
                    data-testid="input-publish-price"
                  />
                  <span className="absolute end-8 top-1/2 -translate-y-1/2 text-white/50 text-3xl">
                    {t('publishModal.currencySymbol')}
                  </span>
                </div>
                <p className="text-lg text-white/50 text-center">
                  {publishPrice === "0" || publishPrice === "" 
                    ? t('publishModal.freeDescription') 
                    : t('publishModal.paidDescription', { price: publishPrice })}
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/journey/${journeyData.id}/edit`)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-16 text-lg"
                  data-testid="button-cancel"
                >
                  {t('publishModal.cancel')}
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 h-16 text-lg"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 mx-auto flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">{t('publishModal.step2Title')}</h2>
                <p className="text-white/60 text-lg">
                  {(parseFloat(publishPrice) || 0) > 0 
                    ? t('publishModal.step2DescriptionPaid')
                    : t('publishModal.step2DescriptionFree')}
                </p>
              </div>

              {(parseFloat(publishPrice) || 0) > 0 ? (
                <div className="space-y-6">
                  <div className={`border-2 rounded-2xl p-6 relative transition-all ${
                    growPaymentUrl || (!externalPaymentUrl && !showOtherPayment) 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-white/20 bg-white/5'
                  }`}>
                    <div className="absolute -top-3 end-4 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {t('publishModal.growRecommended')}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="font-semibold text-white text-xl">{t('publishModal.connectToGrow')}</h4>
                    </div>
                    <p className="text-sm text-white/70 mb-5">{t('publishModal.growDescription')}</p>
                    <ul className="text-sm text-white/60 space-y-3 mb-6">
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>{t('publishModal.growFeature1')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>{t('publishModal.growFeature2')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>{t('publishModal.growFeature3')}</span>
                      </li>
                    </ul>
                    
                    <div className="space-y-4">
                      <Button
                        onClick={() => window.open('https://grow.website/', '_blank')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-base font-medium"
                        data-testid="button-open-grow"
                      >
                        <ExternalLink className="w-4 h-4 mx-2" />
                        {t('publishModal.openGrow')}
                      </Button>
                      
                      <div className="border-t border-white/10 pt-5">
                        <p className="text-sm text-white/60 mb-4 text-center">{t('publishModal.haveGrowAccount')}</p>
                        <Label className="text-white/70 text-sm">{t('publishModal.enterGrowLink')}</Label>
                        <Input
                          type="url"
                          value={growPaymentUrl}
                          onChange={(e) => {
                            setGrowPaymentUrl(e.target.value);
                            setOtherPaymentUrl("");
                            setExternalPaymentUrl(e.target.value);
                          }}
                          placeholder={t('publishModal.growLinkPlaceholder')}
                          className="bg-white/5 border-white/20 text-white h-14 rounded-xl mt-2"
                          data-testid="input-grow-payment-url"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-2xl overflow-hidden transition-all ${
                    otherPaymentUrl ? 'border-violet-500 bg-violet-500/10' : 'border-white/20'
                  }`}>
                    <button
                      onClick={() => setShowOtherPayment(!showOtherPayment)}
                      className="w-full p-5 flex items-center justify-between text-white/70 hover:bg-white/5 transition-colors"
                      data-testid="button-toggle-other-payment"
                    >
                      <span className="font-medium text-lg">{t('publishModal.otherPaymentOption')}</span>
                      {(showOtherPayment || otherPaymentUrl) 
                        ? <ChevronUp className="w-6 h-6" /> 
                        : <ChevronDown className="w-6 h-6" />}
                    </button>
                    
                    {(showOtherPayment || otherPaymentUrl) && (
                      <div className="p-5 pt-0 space-y-4">
                        <p className="text-sm text-white/50">{t('publishModal.otherPaymentDescription')}</p>
                        <Label className="text-white/70 text-sm">{t('publishModal.otherPaymentLabel')}</Label>
                        <Input
                          type="url"
                          value={otherPaymentUrl}
                          onChange={(e) => {
                            setOtherPaymentUrl(e.target.value);
                            setGrowPaymentUrl("");
                            setExternalPaymentUrl(e.target.value);
                          }}
                          placeholder={t('publishModal.otherPaymentPlaceholder')}
                          className="bg-white/5 border-white/20 text-white h-14 rounded-xl"
                          data-testid="input-other-payment-url"
                        />
                        <p className="text-xs text-white/40">{t('publishModal.paymentRedirectNote')}</p>
                      </div>
                    )}
                  </div>

                  {!externalPaymentUrl && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                      <p className="text-sm text-amber-300 text-center">{t('publishModal.enterPaymentLink')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
                  <p className="text-lg text-white/70 text-center">{t('publishModal.freeFlowNote')}</p>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-16 text-lg"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5 mx-2" />
                  {t('publishModal.back')}
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 h-16 text-lg disabled:opacity-50"
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-4">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">{t('publishModal.step3Title')}</h2>
                <p className="text-white/60 text-lg">{t('publishModal.step3Description')}</p>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
                <h4 className="font-medium text-violet-300 mb-3">{t('publishModal.whatIsMiniSite')}</h4>
                <p className="text-sm text-white/70 mb-4">{t('publishModal.miniSiteExplanation')}</p>
                <ul className="text-sm text-white/70 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{t('publishModal.miniSiteFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{t('publishModal.miniSiteFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>{t('publishModal.miniSiteFeature3')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h4 className="font-medium text-white text-lg mb-3">{t('publishModal.flowSummary')}</h4>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/60">{t('publishModal.flowName')}</span>
                  <span className="text-white font-medium">{journeyData.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/60">{t('publishModal.duration')}</span>
                  <span className="text-white font-medium">{t('publishModal.daysCount', { count: journeyData.duration || 7 })}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-white/60">{t('publishModal.price')}</span>
                  <span className="text-white font-medium text-xl">
                    {(parseFloat(publishPrice) || 0) === 0 
                      ? t('free') 
                      : `${t('publishModal.currencySymbol')}${publishPrice}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-16 text-lg"
                  data-testid="button-back-step3"
                >
                  <ArrowLeft className="w-5 h-5 mx-2" />
                  {t('publishModal.back')}
                </Button>
                <Button
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 h-20 text-xl font-bold"
                  data-testid="button-publish-now"
                >
                  {isPublishing ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      <Rocket className="w-7 h-7 mx-3" />
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
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">{t('publishModal.step4Title')}</h2>
                <p className="text-white/60 text-lg">{t('publishModal.step4Description')}</p>
              </div>

              <div className="space-y-4">
                <Label className="text-white/80 text-lg">{t('publishModal.shareableLink')}</Label>
                <div 
                  onClick={handleCopyLink}
                  className="w-full bg-white/5 border-2 border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/10 hover:border-violet-500/50 transition-all"
                  data-testid="button-copy-link"
                >
                  <p className="text-lg text-white/80 break-all leading-relaxed text-center">
                    {getShareableLink()}
                  </p>
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-violet-600 hover:bg-violet-700 h-16 text-lg"
                  data-testid="button-copy-link-action"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-6 h-6 mx-2 text-emerald-400" />
                      {t('publishModal.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-6 h-6 mx-2" />
                      {t('publishModal.copyLink')}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/journey/${journeyData.id}/edit`)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-16 text-lg"
                  data-testid="button-back-to-editor-final"
                >
                  {t('journeySettings.backToEditor')}
                </Button>
                <Button
                  onClick={() => setLocation('/journeys')}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white h-16 text-lg"
                  data-testid="button-to-journeys"
                >
                  {t('publishModal.done')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default JourneyPublishPage;

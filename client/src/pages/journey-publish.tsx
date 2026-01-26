import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Check, Rocket, 
  Loader2, Lock, Crown, Clock, Mail
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
        // If already submitted for approval or approved, show appropriate step
        if (data.approvalStatus === "pending_approval") {
          setCurrentStep(3); // Show pending message
        } else if (data.approvalStatus === "approved" && data.status === "published") {
          setCurrentStep(3); // Show success message
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
      // Submit for approval instead of publishing directly
      const updatedJourney = await journeyApi.update(journeyData.id, { 
        price: priceValue,
        currency: isHebrew ? "ILS" : "USD",
        approvalStatus: "pending_approval",
      });
      setJourneyData(prev => prev ? { ...prev, ...updatedJourney } : null);
      setCurrentStep(3);
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

  const handleStepClick = (step: number) => {
    // Only allow going back if not in final step and journey is not already pending/approved
    if (step < currentStep && journeyData?.approvalStatus !== "pending_approval" && journeyData?.approvalStatus !== "approved") {
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
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => handleStepClick(step)}
              disabled={step >= currentStep || currentStep === 3}
              className={`h-2 rounded-full transition-all ${
                step === currentStep 
                  ? 'w-6 bg-violet-500' 
                  : step < currentStep 
                    ? 'w-2 bg-violet-500 cursor-pointer hover:bg-violet-400' 
                    : 'w-2 bg-white/20'
              } ${step < currentStep && currentStep !== 3 ? 'cursor-pointer' : ''}`}
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
                    className="bg-white/5 border-white/10 focus:border-violet-500 text-white text-5xl text-center h-24 rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  {t('publishModal.step2TitleReview')}
                </h1>
                <p className="text-white/50 mb-8">
                  {t('publishModal.step2DescriptionReview')}
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
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/50">{t('publishModal.duration')}</span>
                    <span className="text-white font-medium">
                      {t('publishModal.daysCount', { count: journeyData.duration || 7 })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-white/10 text-white/60 hover:bg-white/5 hover:text-white h-14"
                    data-testid="button-back"
                  >
                    {t('publishModal.back')}
                  </Button>
                  <Button
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 font-medium"
                    data-testid="button-submit-for-approval"
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

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-violet-500 mx-auto flex items-center justify-center mb-8"
                >
                  {journeyData.approvalStatus === "approved" ? (
                    <Check className="w-10 h-10 text-white" />
                  ) : (
                    <Clock className="w-10 h-10 text-white" />
                  )}
                </motion.div>

                <h1 className="text-3xl font-bold text-white mb-3">
                  {journeyData.approvalStatus === "approved" 
                    ? t('publishModal.approvedTitle')
                    : t('publishModal.successTitle')}
                </h1>
                <p className="text-white/50 mb-8">
                  {journeyData.approvalStatus === "approved" 
                    ? t('publishModal.approvedDescription')
                    : t('publishModal.successDescription')}
                </p>

                <div className="bg-white/5 rounded-2xl p-5 mb-8 text-start">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-violet-400" />
                    <p className="text-white/70">
                      {journeyData.approvalStatus === "approved" 
                        ? t('publishModal.approvedDescription')
                        : t('publishModal.successDescription')}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setLocation('/journeys')}
                  className="w-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white h-14"
                  data-testid="button-back-to-flows"
                >
                  {t('publishModal.backToFlows')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default JourneyPublishPage;

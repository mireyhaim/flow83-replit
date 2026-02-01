import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import type { Journey } from "@shared/schema";
import { motion } from "framer-motion";

const JourneySettingsPage = () => {
  const [match, params] = useRoute("/journey/:id/settings");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    audience: "",
    duration: "7",
    description: "",
    externalPaymentUrl: "",
  });

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) return;
      try {
        const data = await journeyApi.getById(params.id);
        setJourney(data);
        setFormData({
          name: data.name || "",
          goal: data.goal || "",
          audience: data.audience || "",
          duration: data.duration?.toString() || "7",
          description: data.description || "",
          externalPaymentUrl: data.externalPaymentUrl || "",
        });
      } catch (error) {
        toast({
          title: t('error'),
          description: t('journeySettings.failedToLoad'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadJourney();
  }, [params?.id]);

  const handleSave = async () => {
    if (!journey) return;
    setIsSaving(true);
    try {
      await journeyApi.update(journey.id, {
        name: formData.name,
        goal: formData.goal,
        audience: formData.audience,
        duration: parseInt(formData.duration),
        description: formData.description,
        externalPaymentUrl: formData.externalPaymentUrl || null,
      });
      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('journeySettings.failedToSave'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-4">{t('journeySettings.flowNotFound')}</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-go-journeys" className="bg-violet-600 hover:bg-violet-700">
            {t('journeySettings.goToFlows')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a12] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link 
          href={`/journey/${journey.id}/edit`}
          className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-2"
          data-testid="link-back-to-editor"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('journeySettings.backToEditor')}</span>
        </Link>
        
        <h1 className="text-white/70 font-medium">{t('journeySettings.title')}</h1>
        
        <div className="w-20" />
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('journeySettings.editFlowDetails')}
            </h1>
            <p className="text-white/50">{journey.name}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 text-sm mb-2">{t('journeySettings.flowName')} *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('journeySettings.flowNamePlaceholder')}
                className="bg-white/5 border-white/10 focus:border-violet-500 text-white h-12 rounded-xl"
                data-testid="input-journey-name"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">{t('journeySettings.mainGoal')} *</label>
              <Textarea 
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder={t('journeySettings.mainGoalPlaceholder')}
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-violet-500 text-white rounded-xl resize-none"
                data-testid="textarea-journey-goal"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">{t('journeySettings.targetAudience')} *</label>
              <Input 
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder={t('journeySettings.targetAudiencePlaceholder')}
                className="bg-white/5 border-white/10 focus:border-violet-500 text-white h-12 rounded-xl"
                data-testid="input-journey-audience"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-3">{t('journeySettings.duration')} *</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, duration: "3" })}
                  data-testid="radio-duration-3"
                  className={`flex-1 py-4 rounded-xl border transition-all text-center ${
                    formData.duration === "3"
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm opacity-70">{t('journeySettings.days3')}</div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, duration: "7" })}
                  data-testid="radio-duration-7"
                  className={`flex-1 py-4 rounded-xl border transition-all text-center ${
                    formData.duration === "7"
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-sm opacity-70">{t('journeySettings.days7')}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/40 text-sm mb-2">
                {t('journeySettings.description')} <span className="text-white/20">({t('journeySettings.descriptionOptional')})</span>
              </label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('journeySettings.descriptionPlaceholder')}
                className="min-h-[80px] bg-white/5 border-white/10 focus:border-violet-500 text-white rounded-xl resize-none"
                data-testid="textarea-journey-description"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <label className="block text-white/70 text-sm mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('journeySettings.paymentLink', 'לינק תשלום (Grow)')}
              </label>
              <Input 
                value={formData.externalPaymentUrl}
                onChange={(e) => setFormData({ ...formData, externalPaymentUrl: e.target.value })}
                placeholder="https://grow.link/..."
                className="bg-white/5 border-white/10 focus:border-violet-500 text-white h-12 rounded-xl ltr"
                dir="ltr"
                data-testid="input-payment-link"
              />
              <p className="text-white/30 text-xs mt-2">
                {t('journeySettings.paymentLinkHelp', 'הכנס את לינק התשלום של Grow שמשתתפים ישתמשו בו לתשלום')}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Button 
              onClick={handleSave} 
              className="w-full bg-violet-600 hover:bg-violet-700 h-14 text-lg font-medium"
              disabled={isSaving || !formData.name || !formData.goal || !formData.audience}
              data-testid="button-save-settings"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mx-2" />
                  {t('journeySettings.saveAndReturn')}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default JourneySettingsPage;

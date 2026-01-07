import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Save, Settings, LayoutGrid, Target, Users, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import type { Journey } from "@shared/schema";
import { motion } from "framer-motion";
import { GlassPanel, GradientHeader } from "@/components/ui/glass-panel";

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

  if (!journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        <GlassPanel className="text-center max-w-md relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">{t('journeySettings.flowNotFound')}</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-go-journeys" className="bg-violet-600 hover:bg-violet-700">
            {t('journeySettings.goToFlows')}
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
              <div className="flex items-center gap-3">
                <Link href="/journeys" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors" data-testid="link-my-flows">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium hidden md:inline">{t('journeyCreate.myFlows')}</span>
                </Link>
                <div className="h-5 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-base md:text-lg font-semibold text-white">{t('journeySettings.title')}</h1>
                </div>
              </div>
              <button
                onClick={() => setLocation(`/journey/${journey.id}/edit`)}
                className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
                data-testid="button-back-to-editor"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">{t('journeySettings.backToEditor')}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GradientHeader
              icon={<Settings className="w-full h-full" />}
              title={t('journeySettings.editFlowDetails')}
              subtitle={journey.name}
              size="md"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-8"
          >
            <GlassPanel className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <Label htmlFor="name" className="text-sm font-medium text-white">{t('journeySettings.flowName')} *</Label>
                </div>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('journeySettings.flowNamePlaceholder')}
                  className="bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white placeholder:text-white/30 h-12 rounded-xl transition-colors"
                  data-testid="input-journey-name"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-violet-400" />
                  <Label htmlFor="goal" className="text-sm font-medium text-white">{t('journeySettings.mainGoal')} *</Label>
                </div>
                <Textarea 
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder={t('journeySettings.mainGoalPlaceholder')}
                  className="min-h-[100px] bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white placeholder:text-white/30 rounded-xl transition-colors resize-none"
                  data-testid="textarea-journey-goal"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-violet-400" />
                  <Label htmlFor="audience" className="text-sm font-medium text-white">{t('journeySettings.targetAudience')} *</Label>
                </div>
                <Input 
                  id="audience"
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  placeholder={t('journeySettings.targetAudiencePlaceholder')}
                  className="bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white placeholder:text-white/30 h-12 rounded-xl transition-colors"
                  data-testid="input-journey-audience"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <Label className="text-sm font-medium text-white">{t('journeySettings.duration')} *</Label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, duration: "3" })}
                    data-testid="radio-duration-3"
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      formData.duration === "3"
                        ? "bg-violet-600/20 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl font-bold mb-1">3</div>
                    <div className="text-sm opacity-70">{t('journeySettings.days3')}</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, duration: "7" })}
                    data-testid="radio-duration-7"
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      formData.duration === "7"
                        ? "bg-violet-600/20 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl font-bold mb-1">7</div>
                    <div className="text-sm opacity-70">{t('journeySettings.days7')}</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-white/40" />
                  <Label htmlFor="description" className="text-sm font-medium text-white/60">{t('journeySettings.description')}</Label>
                  <span className="text-xs text-white/30">({t('journeySettings.descriptionOptional')})</span>
                </div>
                <Textarea 
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('journeySettings.descriptionPlaceholder')}
                  className="min-h-[80px] bg-white/5 border-white/10 hover:border-violet-500/50 focus:border-violet-500 text-white placeholder:text-white/30 rounded-xl transition-colors resize-none"
                  data-testid="textarea-journey-description"
                />
              </div>
            </GlassPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6"
          >
            <Button 
              onClick={handleSave} 
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-14 text-lg font-medium shadow-lg shadow-violet-600/25"
              disabled={isSaving || !formData.name || !formData.goal || !formData.audience}
              data-testid="button-save-settings"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin mx-2" />
              ) : (
                <Save className="w-5 h-5 mx-2" />
              )}
              {t('journeySettings.saveAndReturn')}
            </Button>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default JourneySettingsPage;

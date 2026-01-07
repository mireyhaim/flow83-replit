import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, Eye, Loader2, Globe, GlobeLock, Target, 
  LayoutGrid, Sparkles, ChevronDown, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { journeyApi, stepApi, blockApi } from "@/lib/api";
import type { Journey, JourneyStep as JourneyStepType, JourneyBlock } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type StepWithBlocks = JourneyStepType & { blocks: JourneyBlock[] };
type JourneyWithSteps = Journey & { steps: StepWithBlocks[] };

const JourneyEditorPage = () => {
  const { t, i18n } = useTranslation('dashboard');
  const isHebrew = i18n.language === 'he';
  const [match, params] = useRoute("/journey/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [journeyData, setJourneyData] = useState<JourneyWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ stepId: string; field: string } | null>(null);

  // Force refresh user data when entering the editor (once on mount) to get fresh subscription status
  const hasRefreshedUser = useRef(false);
  useEffect(() => {
    if (!hasRefreshedUser.current) {
      hasRefreshedUser.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  }, [queryClient]);

  // Check for subscription success return and redirect to publish
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionResult = urlParams.get('subscription');
    
    if (subscriptionResult === 'success' && journeyData) {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.history.replaceState({}, '', window.location.pathname);
      toast({
        title: t('subscriptionActivated'),
        description: t('canNowPublishFlow'),
      });
      setLocation(`/journey/${journeyData.id}/publish`);
    }
  }, [journeyData, queryClient]);

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) return;
      try {
        const data = await journeyApi.getFull(params.id);
        const sortedSteps = data.steps.sort((a, b) => a.dayNumber - b.dayNumber);
        setJourneyData({ ...data, steps: sortedSteps });
        
        if (sortedSteps.length === 0) {
          setIsGenerating(true);
          try {
            const result = await journeyApi.autoGenerate(params.id);
            if (result.success && result.steps.length > 0) {
              const fullData = await journeyApi.getFull(params.id);
              const newSortedSteps = fullData.steps.sort((a, b) => a.dayNumber - b.dayNumber);
              setJourneyData({ ...fullData, steps: newSortedSteps });
              setExpandedDays(new Set([newSortedSteps[0]?.id]));
            }
          } catch (error) {
            toast({
              title: t('generationFailed'),
              description: t('couldNotGenerateContent'),
              variant: "destructive",
            });
          } finally {
            setIsGenerating(false);
          }
        } else {
          setExpandedDays(new Set([sortedSteps[0]?.id]));
        }
      } catch (error) {
        toast({
          title: t('error'),
          description: t('failedToLoadFlow'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadJourney();
  }, [params?.id]);

  const handleSave = async () => {
    if (!journeyData) return;
    setIsSaving(true);
    try {
      await journeyApi.update(journeyData.id, {
        name: journeyData.name,
        goal: journeyData.goal,
        audience: journeyData.audience,
        duration: journeyData.duration,
        description: journeyData.description,
      });
      
      for (const step of journeyData.steps) {
        await stepApi.update(step.id, {
          title: step.title,
          description: step.goal,
          goal: step.goal,
          explanation: step.explanation,
          task: step.task,
        });
        
        // Update blocks for chat compatibility
        for (const block of step.blocks) {
          if (block.type === "text") {
            await blockApi.update(block.id, { content: { text: step.explanation } });
          } else if (block.type === "reflection") {
            await blockApi.update(block.id, { content: { question: `Reflecting on today's goal: ${step.goal}. What resonates with you about this?` } });
          } else if (block.type === "task") {
            await blockApi.update(block.id, { content: { task: step.task } });
          }
        }
      }
      
      toast({
        title: t('saved'),
        description: t('flowSavedSuccessfully'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSaveFlow'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (journeyData) {
      window.open(`/p/${journeyData.id}`, '_blank');
    }
  };

  const handlePublishClick = () => {
    if (!journeyData) return;
    
    if (journeyData.status === "published") {
      handleUnpublish();
    } else {
      // Navigate to the full-page publish flow
      setLocation(`/journey/${journeyData.id}/publish`);
    }
  };

  const handleUnpublish = async () => {
    if (!journeyData) return;
    setIsPublishing(true);
    try {
      await journeyApi.update(journeyData.id, { status: "draft" });
      setJourneyData(prev => prev ? { ...prev, status: "draft" } : null);
      toast({
        title: t('unpublished'),
        description: t('flowNowDraft'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUnpublishFlow'),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const updateStepField = (stepId: string, field: string, value: string) => {
    setJourneyData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId ? { ...step, [field]: value } : step
        )
      };
    });
  };

  const toggleDay = (stepId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-white/60">{t('loadingFlow')}</p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 mx-auto animate-ping opacity-20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('creatingYourFlow')}</h2>
          <p className="text-white/60">
            {t('aiGeneratingContent')}
          </p>
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
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/journeys" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors shrink-0" data-testid="link-my-flows">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{t('myFlows')}</span>
              </Link>
              <div className="h-5 w-px bg-white/10 hidden sm:block" />
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-semibold text-white truncate" data-testid="text-journey-name">
                  {journeyData.name}
                </h1>
              </div>
              {journeyData.status === "published" && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium shrink-0">
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">{t('live')}</span>
                </span>
              )}
            </div>
            
            <div className="flex gap-1 md:gap-3 items-center shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation(`/journey/${journeyData.id}/settings`)}
                className="text-white/60 hover:text-white hover:bg-white/10 px-2 md:px-3"
                data-testid="button-settings"
              >
                <span className="hidden sm:inline">{t('settings')}</span>
                <Target className="w-4 h-4 sm:hidden" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePreview} 
                className="text-white/60 hover:text-white hover:bg-white/10 px-2 md:px-3"
                data-testid="button-preview"
              >
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('preview')}</span>
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm"
                variant="outline"
                disabled={isSaving}
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-save"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t('save')}
              </Button>
              <Button 
                onClick={handlePublishClick} 
                size="sm"
                className={journeyData.status === "published" 
                  ? "bg-amber-600 hover:bg-amber-700" 
                  : "bg-violet-600 hover:bg-violet-700"}
                disabled={isPublishing}
                data-testid="button-publish"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : journeyData.status === "published" ? (
                  <GlobeLock className="w-4 h-4 mr-2" />
                ) : (
                  <Globe className="w-4 h-4 mr-2" />
                )}
                {journeyData.status === "published" ? t('unpublishFlow') : t('publishFlow')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold text-white">{t('flowGoal')}</h2>
          </div>
          <p className="text-white/60 text-sm mb-4">
            {journeyData.goal || t('noGoalSetYet')}
          </p>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>{t('days', { count: journeyData.duration || 7 })}</span>
            <span>•</span>
            <span>{t('for')}: {journeyData.audience || t('notSpecified')}</span>
          </div>
        </div>

        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute start-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-600/50 via-fuchsia-600/50 to-violet-600/30" />
          
          <div className="space-y-8">
            {journeyData.steps.map((step, index) => {
              const isExpanded = expandedDays.has(step.id);
              const isComplete = step.goal && step.explanation && step.task;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative ps-16"
                >
                  {/* Timeline node */}
                  <button
                    onClick={() => toggleDay(step.id)}
                    className="absolute start-0 top-0 z-10 group"
                    data-testid={`toggle-day-${step.dayNumber}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isExpanded 
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30" 
                        : "bg-[#1a1a2e] border-2 border-violet-600/40 group-hover:border-violet-500"
                    }`}>
                      <span className={`text-lg font-bold ${isExpanded ? "text-white" : "text-white/70"}`}>
                        {step.dayNumber}
                      </span>
                    </div>
                    {isComplete && (
                      <div className="absolute -end-1 -bottom-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                  
                  {/* Day content */}
                  <div className="min-h-[48px]">
                    <button
                      onClick={() => toggleDay(step.id)}
                      className="flex items-center gap-3 text-left group w-full"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                          {step.title}
                        </h3>
                        {!isExpanded && (
                          <p className="text-sm text-white/40 line-clamp-1 mt-1">
                            {step.goal || t('clickToEditDay')}
                          </p>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-white/30" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-6 pb-4 space-y-6">
                            <div>
                              <Input
                                value={step.title}
                                onChange={(e) => updateStepField(step.id, "title", e.target.value)}
                                className="bg-transparent border-0 border-b border-white/10 rounded-none text-white text-lg font-medium placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-violet-500 px-0"
                                placeholder={t('dayTitlePlaceholder')}
                                data-testid={`input-title-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                <span className="text-sm font-medium text-violet-400">{t('goal')}</span>
                              </div>
                              <Textarea
                                value={step.goal || ""}
                                onChange={(e) => updateStepField(step.id, "goal", e.target.value)}
                                placeholder={t('goalPlaceholder')}
                                className="bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 px-0 resize-none min-h-[60px]"
                                data-testid={`textarea-goal-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                                <span className="text-sm font-medium text-fuchsia-400">{t('explanation')}</span>
                              </div>
                              <Textarea
                                value={step.explanation || ""}
                                onChange={(e) => updateStepField(step.id, "explanation", e.target.value)}
                                placeholder={t('explanationPlaceholder')}
                                className="bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 px-0 resize-none min-h-[120px]"
                                data-testid={`textarea-explanation-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">{t('task')}</span>
                              </div>
                              <Textarea
                                value={step.task || ""}
                                onChange={(e) => updateStepField(step.id, "task", e.target.value)}
                                placeholder={t('taskPlaceholder')}
                                className="bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 px-0 resize-none min-h-[80px]"
                                data-testid={`textarea-task-${step.dayNumber}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {journeyData.steps.length === 0 && !isGenerating && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('noDaysYet')}</h3>
            <p className="text-white/50 mb-6">{t('contentGenerationFailed')}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {t('refreshPage')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default JourneyEditorPage;

import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Save, Eye, Loader2, Globe, GlobeLock, Target, 
  LayoutGrid, Sparkles, ChevronDown, ChevronUp,
  Edit3, CheckCircle, Copy, Check, ExternalLink, ArrowRight, Rocket, Lock, Crown, CreditCard, ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, stepApi, blockApi } from "@/lib/api";
import type { Journey, JourneyStep as JourneyStepType, JourneyBlock } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

type StepWithBlocks = JourneyStepType & { blocks: JourneyBlock[] };
type JourneyWithSteps = Journey & { steps: StepWithBlocks[] };

const JourneyEditorPage = () => {
  const [match, params] = useRoute("/journey/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [journeyData, setJourneyData] = useState<JourneyWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStep, setPublishStep] = useState<1 | 2 | 3 | 4>(1);
  const [publishPrice, setPublishPrice] = useState("");
  const [externalPaymentUrl, setExternalPaymentUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [expandedPlanDetails, setExpandedPlanDetails] = useState(false);

  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery<{ plan: string | null; status: string | null }>({
    queryKey: ["/api/subscription/status"],
    queryFn: () => fetch("/api/subscription/status", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  const hasActiveSubscription = subscriptionStatus?.status === "active" || subscriptionStatus?.status === "trialing";
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ stepId: string; field: string } | null>(null);

  // Check for subscription success return and auto-open publish modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionResult = urlParams.get('subscription');
    
    if (subscriptionResult === 'success' && journeyData && hasActiveSubscription) {
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);
      
      // Show success toast
      toast({
        title: "Subscription activated!",
        description: "You can now publish your flow.",
      });
      
      // Auto-open the publish modal
      setPublishPrice(journeyData.price?.toString() || "0");
      setExternalPaymentUrl(journeyData.externalPaymentUrl || "");
      setPublishStep(1);
      setShowPublishModal(true);
    }
  }, [journeyData, hasActiveSubscription]);

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
              title: "Generation failed",
              description: "Could not generate flow content. Please try again.",
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
          title: "Error",
          description: "Failed to load flow",
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
        title: "Saved!",
        description: "Your flow has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save flow",
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
      // Wait for subscription status to load before checking
      if (!isLoadingSubscription && !hasActiveSubscription) {
        setShowPaywallModal(true);
        return;
      }
      setPublishPrice(journeyData.price?.toString() || "0");
      setExternalPaymentUrl(journeyData.externalPaymentUrl || "");
      setPublishStep(1);
      setShowPublishModal(true);
    }
  };

  const handleUnpublish = async () => {
    if (!journeyData) return;
    setIsPublishing(true);
    try {
      await journeyApi.update(journeyData.id, { status: "draft" });
      setJourneyData(prev => prev ? { ...prev, status: "draft" } : null);
      toast({
        title: "Unpublished",
        description: "Your flow is now in draft mode.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unpublish flow",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!journeyData) return;
    setIsPublishing(true);
    
    const priceValue = parseFloat(publishPrice) || 0;
    
    try {
      const updatedJourney = await journeyApi.update(journeyData.id, { 
        status: "published",
        price: priceValue,
        currency: "USD",
        externalPaymentUrl: externalPaymentUrl || null,
      });
      setJourneyData(prev => prev ? { ...prev, ...updatedJourney, steps: prev.steps } : null);
      setPublishStep(4);
    } catch (error: any) {
      // Check if it's a subscription error (402)
      const errorMsg = error?.message || "";
      if (errorMsg.includes("subscription_required") || errorMsg.startsWith("402:")) {
        setShowPublishModal(false);
        setShowPaywallModal(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to publish flow",
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
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
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
          <p className="text-white/60">Loading your flow...</p>
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
          <h2 className="text-2xl font-bold text-white mb-2">Creating Your Flow</h2>
          <p className="text-white/60">
            AI is generating personalized content for each day based on your goals and audience...
          </p>
        </div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Flow not found</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-back">
            Back to Flows
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
                <span className="text-sm font-medium hidden sm:inline">My Flows</span>
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
                  <span className="hidden sm:inline">Live</span>
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
                <span className="hidden sm:inline">Settings</span>
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
                <span className="hidden sm:inline">Preview</span>
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
                Save
              </Button>
              <Button 
                onClick={handlePublishClick} 
                size="sm"
                className={journeyData.status === "published" 
                  ? "bg-amber-600 hover:bg-amber-700" 
                  : "bg-violet-600 hover:bg-violet-700"}
                disabled={isPublishing || (isLoadingSubscription && journeyData.status !== "published")}
                data-testid="button-publish"
              >
                {isPublishing || (isLoadingSubscription && journeyData.status !== "published") ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : journeyData.status === "published" ? (
                  <GlobeLock className="w-4 h-4 mr-2" />
                ) : (
                  <Globe className="w-4 h-4 mr-2" />
                )}
                {journeyData.status === "published" ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold text-white">Flow Goal</h2>
          </div>
          <p className="text-white/60 text-sm mb-4">
            {journeyData.goal || "No goal set yet"}
          </p>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>{journeyData.duration || 7} days</span>
            <span>•</span>
            <span>For: {journeyData.audience || "Not specified"}</span>
          </div>
        </div>

        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-600/50 via-fuchsia-600/50 to-violet-600/30" />
          
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
                  className="relative pl-16"
                >
                  {/* Timeline node */}
                  <button
                    onClick={() => toggleDay(step.id)}
                    className="absolute left-0 top-0 z-10 group"
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
                      <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
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
                            {step.goal || "Click to edit this day"}
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
                                placeholder="Day title..."
                                data-testid={`input-title-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                <span className="text-sm font-medium text-violet-400">Goal</span>
                              </div>
                              <Textarea
                                value={step.goal || ""}
                                onChange={(e) => updateStepField(step.id, "goal", e.target.value)}
                                placeholder="What will the participant achieve today?"
                                className="bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 px-0 resize-none min-h-[60px]"
                                data-testid={`textarea-goal-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                                <span className="text-sm font-medium text-fuchsia-400">Explanation</span>
                              </div>
                              <Textarea
                                value={step.explanation || ""}
                                onChange={(e) => updateStepField(step.id, "explanation", e.target.value)}
                                placeholder="Teaching content, insights, or guidance..."
                                className="bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 px-0 resize-none min-h-[120px]"
                                data-testid={`textarea-explanation-${step.dayNumber}`}
                              />
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-sm font-medium text-emerald-400">Task</span>
                              </div>
                              <Textarea
                                value={step.task || ""}
                                onChange={(e) => updateStepField(step.id, "task", e.target.value)}
                                placeholder="Practical exercise or action for the participant..."
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
            <h3 className="text-xl font-semibold text-white mb-2">No days yet</h3>
            <p className="text-white/50 mb-6">Content generation may have failed. Try refreshing the page.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </main>

      {/* Publish Modal - 4 Steps */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 pt-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${publishStep >= 1 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>
                {publishStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className={`text-xs ${publishStep >= 1 ? 'text-white' : 'text-white/50'}`}>Price</span>
            </div>
            <div className={`w-8 h-0.5 mt-[-16px] ${publishStep >= 2 ? 'bg-violet-600' : 'bg-white/20'}`} />
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${publishStep >= 2 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>
                {publishStep > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-xs ${publishStep >= 2 ? 'text-white' : 'text-white/50'}`}>Stripe</span>
            </div>
            <div className={`w-8 h-0.5 mt-[-16px] ${publishStep >= 3 ? 'bg-violet-600' : 'bg-white/20'}`} />
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${publishStep >= 3 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>
                {publishStep > 3 ? <Check className="w-5 h-5" /> : '3'}
              </div>
              <span className={`text-xs ${publishStep >= 3 ? 'text-white' : 'text-white/50'}`}>Create</span>
            </div>
            <div className={`w-8 h-0.5 mt-[-16px] ${publishStep >= 4 ? 'bg-violet-600' : 'bg-white/20'}`} />
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${publishStep >= 4 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>
                4
              </div>
              <span className={`text-xs ${publishStep >= 4 ? 'text-white' : 'text-white/50'}`}>Share</span>
            </div>
          </div>

          {/* Intro Message */}
          <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-xl p-4 mb-4">
            <p className="text-center text-white/90">
              <Sparkles className="w-4 h-4 inline-block mr-2 text-violet-400" />
              A few more steps and you'll get a link to your flow that you can share with your clients
            </p>
          </div>

          {publishStep === 1 ? (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center">Step 1: Set Your Price</DialogTitle>
                <DialogDescription className="text-white/60 text-center text-base">
                  Decide how much you want to charge for your flow
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                  <h4 className="font-medium text-violet-300 mb-2">Why set a price?</h4>
                  <p className="text-sm text-white/70 mb-3">
                    This is your work and expertise packaged into a digital experience. You decide its value.
                  </p>
                  <ul className="text-sm text-white/70 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Free:</strong> Great for building your audience and getting testimonials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Paid:</strong> Clients invest in themselves and take the journey more seriously</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <Label className="text-white/80 text-lg">Price (in USD)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={publishPrice}
                      onChange={(e) => setPublishPrice(e.target.value)}
                      placeholder="0"
                      className="bg-white/5 border-white/20 text-white text-3xl text-center h-20 rounded-xl"
                      data-testid="input-publish-price"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 text-2xl">$</span>
                  </div>
                  <p className="text-base text-white/50 text-center">
                    {publishPrice === "0" || publishPrice === "" ? "Free - clients can join without payment" : `Clients will pay $${publishPrice} to access your flow`}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 h-14 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setPublishStep(2)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 text-base"
                    data-testid="button-next-step"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Next Step
                  </Button>
                </div>
              </div>
            </>
          ) : publishStep === 2 ? (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
                  <CreditCard className="w-7 h-7 text-violet-400" />
                  Step 2: Payment Setup
                </DialogTitle>
                <DialogDescription className="text-white/60 text-center text-base">
                  {(parseFloat(publishPrice) || 0) > 0 
                    ? "Choose how you'd like to receive payments from clients"
                    : "This step is optional for free flows"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {(parseFloat(publishPrice) || 0) > 0 ? (
                  <>
                    <div className="border border-violet-500 bg-violet-500/10 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <ExternalLink className="w-5 h-5 text-violet-400" />
                        <h4 className="font-medium text-white">Your Payment Link</h4>
                      </div>
                      <p className="text-sm text-white/60 mb-4">
                        Use your existing PayPal, Stripe Payment Link, or any other payment link. Works from any country - payments go directly to you.
                      </p>
                      <div className="space-y-3">
                        <Label className="text-white/70 text-sm">Payment Link URL</Label>
                        <Input
                          type="url"
                          value={externalPaymentUrl}
                          onChange={(e) => setExternalPaymentUrl(e.target.value)}
                          placeholder="https://paypal.me/... or https://buy.stripe.com/..."
                          className="bg-white/5 border-white/20 text-white h-12 rounded-lg"
                          data-testid="input-external-payment-url"
                        />
                        <p className="text-xs text-white/40">
                          Clients will be redirected to this link to pay, then return to access your flow.
                        </p>
                      </div>
                    </div>

                    {!externalPaymentUrl && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <p className="text-sm text-amber-300 text-center">
                          Please enter your payment link to continue.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                    <p className="text-sm text-white/70 text-center">
                      Your flow is free! No payment setup needed. Click "Skip & Continue" to proceed.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPublishStep(1)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 h-14 text-base"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setPublishStep(3)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-next-after-payment"
                    disabled={(parseFloat(publishPrice) || 0) > 0 && !externalPaymentUrl}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    {(parseFloat(publishPrice) || 0) === 0 ? "Skip & Continue" : 
                      externalPaymentUrl ? "Next Step" : "Setup Required"}
                  </Button>
                </div>
              </div>
            </>
          ) : publishStep === 3 ? (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
                  <Rocket className="w-8 h-8 text-violet-400" />
                  Step 3: Create Your Mini-Site
                </DialogTitle>
                <DialogDescription className="text-white/60 text-center text-base">
                  We'll create a beautiful landing page for your flow
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                  <h4 className="font-medium text-violet-300 mb-2">What is a Mini-Site?</h4>
                  <p className="text-sm text-white/70 mb-3">
                    Your mini-site is a professional landing page that presents your flow to potential clients. It includes everything they need to decide to join.
                  </p>
                  <ul className="text-sm text-white/70 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span>Beautiful design that represents your brand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span>Clear description of what clients will experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span>Easy sign-up and payment process for clients</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                  <h4 className="font-medium text-white mb-2">Your Flow Summary</h4>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Flow Name</span>
                    <span className="text-white font-medium">{journeyData.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/60">Duration</span>
                    <span className="text-white font-medium">{journeyData.steps.length} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white/60">Price</span>
                    <span className="text-white font-medium text-lg">
                      {(parseFloat(publishPrice) || 0) === 0 ? "Free" : `$${publishPrice}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPublishStep(2)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 h-14 text-base"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 h-16 text-lg font-semibold"
                    data-testid="button-publish-now"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-6 h-6 mr-3" />
                        Create & Publish
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  Step 4: Share Your Link
                </DialogTitle>
                <DialogDescription className="text-white/60 text-center text-base">
                  Your flow is live! Share this link with your clients
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                  <h4 className="font-medium text-emerald-300 mb-2">Congratulations!</h4>
                  <p className="text-sm text-white/70">
                    Your flow is now live and ready for clients. Copy the link below and share it on social media, in emails, or anywhere you connect with your audience.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-white/80 text-base">Your shareable link</Label>
                  <div 
                    onClick={handleCopyLink}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    data-testid="button-copy-link"
                  >
                    <p className="text-sm text-white/80 break-all leading-relaxed">
                      {getShareableLink()}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className="w-full bg-violet-600 hover:bg-violet-700 h-14 text-base"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-5 h-5 mr-2 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                  <h4 className="font-medium text-violet-300 mb-2">What's next?</h4>
                  <p className="text-sm text-white/70">
                    Share this link with your clients. They'll see your beautiful landing page, can sign up (and pay if priced), and begin their journey with you.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 h-14 text-base"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => window.open(getShareableLink(), '_blank')}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 h-14 text-base"
                    data-testid="button-view-landing"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    View My Page
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Paywall Modal - Inline Pricing */}
      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Back button at top left */}
          <button
            onClick={() => setShowPaywallModal(false)}
            className="absolute left-4 top-4 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <DialogHeader className="space-y-4 pt-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Choose a Plan to Activate Your Flow
            </DialogTitle>
            <DialogDescription className="text-white/60 text-center text-base">
              You've created something amazing! To publish your flow and start sharing it with clients, choose a plan that fits your needs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
              <h4 className="font-medium text-violet-300 mb-2 text-center">What you'll unlock:</h4>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  Publish flows
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  Sales page
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  Direct payments
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  Analytics
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-white">$26</span>
                  <span className="text-white/50 ml-1">/month</span>
                </div>
                <p className="text-xs text-violet-400 mb-3">7-day free trial</p>
                <ul className="text-sm text-white/70 space-y-1.5 mb-2 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Create 1 Flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Up to 60 users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Sales landing page</span>
                  </li>
                  {expandedPlanDetails && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>$0.60 per user above 60</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Direct payment integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Full cloud hosting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Analytics dashboard</span>
                      </li>
                    </>
                  )}
                </ul>
                <button
                  onClick={() => setExpandedPlanDetails(!expandedPlanDetails)}
                  className="text-xs text-violet-400 hover:text-violet-300 mb-3 flex items-center gap-1"
                >
                  {expandedPlanDetails ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
                <Button
                  onClick={() => {
                    const baseUrl = 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
                    const returnUrl = encodeURIComponent(`${window.location.origin}/journey/${journeyData?.id}/edit?subscription=success`);
                    window.open(`${baseUrl}&checkout[custom][journey_id]=${journeyData?.id}&checkout[redirect_url]=${returnUrl}`, '_blank');
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  data-testid="button-subscribe-starter"
                >
                  Start Free Trial
                </Button>
              </div>

              {/* Pro - Popular */}
              <div className="bg-violet-600/20 border-2 border-violet-500 rounded-xl p-5 flex flex-col relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 mt-2">Pro</h3>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-bold text-white">$83</span>
                  <span className="text-white/50 ml-1">/month</span>
                </div>
                <ul className="text-sm text-white/70 space-y-1.5 mb-2 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Create up to 5 Flows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Up to 300 users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Extended data dashboard</span>
                  </li>
                  {expandedPlanDetails && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>$0.60 per user above 300</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Personal sales landing page for each journey</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Direct payment integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Full cloud hosting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Extended data dashboard</span>
                      </li>
                    </>
                  )}
                </ul>
                <button
                  onClick={() => setExpandedPlanDetails(!expandedPlanDetails)}
                  className="text-xs text-violet-400 hover:text-violet-300 mb-3 flex items-center gap-1"
                >
                  {expandedPlanDetails ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
                <Button
                  onClick={() => {
                    const baseUrl = 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
                    const returnUrl = encodeURIComponent(`${window.location.origin}/journey/${journeyData?.id}/edit?subscription=success`);
                    window.open(`${baseUrl}&checkout[custom][journey_id]=${journeyData?.id}&checkout[redirect_url]=${returnUrl}`, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  data-testid="button-subscribe-pro"
                >
                  Choose Pro
                </Button>
              </div>

              {/* Business */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1">Business</h3>
                <div className="flex items-baseline mb-3">
                  <span className="text-3xl font-bold text-white">$188</span>
                  <span className="text-white/50 ml-1">/month</span>
                </div>
                <ul className="text-sm text-white/70 space-y-1.5 mb-2 flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Create up to 10 Flows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Up to 1000 users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>$0.40/user overage</span>
                  </li>
                  {expandedPlanDetails && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Personal sales landing page for each journey</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Direct payment integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Full cloud hosting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Advanced AI Flow Composer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>Extended data dashboard</span>
                      </li>
                    </>
                  )}
                </ul>
                <button
                  onClick={() => setExpandedPlanDetails(!expandedPlanDetails)}
                  className="text-xs text-violet-400 hover:text-violet-300 mb-3 flex items-center gap-1"
                >
                  {expandedPlanDetails ? (
                    <>Show less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
                <Button
                  onClick={() => {
                    const baseUrl = 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
                    const returnUrl = encodeURIComponent(`${window.location.origin}/journey/${journeyData?.id}/edit?subscription=success`);
                    window.open(`${baseUrl}&checkout[custom][journey_id]=${journeyData?.id}&checkout[redirect_url]=${returnUrl}`, '_blank');
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  data-testid="button-subscribe-business"
                >
                  Choose Business
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JourneyEditorPage;

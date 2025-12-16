import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, Eye, Loader2, Globe, GlobeLock, Target, 
  LayoutGrid, Sparkles, ChevronDown, ChevronUp,
  Edit3, CheckCircle
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
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ stepId: string; field: string } | null>(null);

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

  const handlePublish = async () => {
    if (!journeyData) return;
    setIsPublishing(true);
    const newStatus = journeyData.status === "published" ? "draft" : "published";
    try {
      await journeyApi.update(journeyData.id, { status: newStatus });
      setJourneyData(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: newStatus === "published" ? "Published!" : "Unpublished",
        description: newStatus === "published" 
          ? "Your flow is now live and accessible to participants." 
          : "Your flow is now in draft mode.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: newStatus === "published" ? "Failed to publish flow" : "Failed to unpublish flow",
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
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/journeys" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-my-flows">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">My Flows</span>
              </Link>
              <div className="h-5 w-px bg-white/10" />
              <div>
                <h1 className="text-lg font-semibold text-white" data-testid="text-journey-name">
                  {journeyData.name}
                </h1>
              </div>
              {journeyData.status === "published" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <Globe className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
            
            <div className="flex gap-3 items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation(`/journey/${journeyData.id}/settings`)}
                className="text-white/60 hover:text-white hover:bg-white/10"
                data-testid="button-settings"
              >
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePreview} 
                className="text-white/60 hover:text-white hover:bg-white/10"
                data-testid="button-preview"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
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
                onClick={handlePublish} 
                size="sm"
                className={journeyData.status === "published" 
                  ? "bg-amber-600 hover:bg-amber-700" 
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"}
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
                {journeyData.status === "published" ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
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

        <div className="space-y-4">
          {journeyData.steps.map((step, index) => {
            const isExpanded = expandedDays.has(step.id);
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleDay(step.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                  data-testid={`toggle-day-${step.dayNumber}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center border border-violet-500/20">
                      <span className="text-lg font-bold text-white">{step.dayNumber}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-white/50 line-clamp-1">{step.goal || "No goal set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {step.goal && step.explanation && step.task && (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-5">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Day Title
                          </label>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStepField(step.id, "title", e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            data-testid={`input-title-${step.dayNumber}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-violet-400 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Goal
                          </label>
                          <p className="text-xs text-white/40 mb-2">What will the participant achieve today?</p>
                          <Textarea
                            value={step.goal || ""}
                            onChange={(e) => updateStepField(step.id, "goal", e.target.value)}
                            placeholder="Describe the goal for this day..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                            data-testid={`textarea-goal-${step.dayNumber}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-fuchsia-400 mb-2 flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Explanation
                          </label>
                          <p className="text-xs text-white/40 mb-2">Teaching content, insights, or guidance for the participant</p>
                          <Textarea
                            value={step.explanation || ""}
                            onChange={(e) => updateStepField(step.id, "explanation", e.target.value)}
                            placeholder="Write the teaching content for this day..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[150px]"
                            data-testid={`textarea-explanation-${step.dayNumber}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Task
                          </label>
                          <p className="text-xs text-white/40 mb-2">Practical exercise or action for the participant to take</p>
                          <Textarea
                            value={step.task || ""}
                            onChange={(e) => updateStepField(step.id, "task", e.target.value)}
                            placeholder="Describe the task or exercise..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                            data-testid={`textarea-task-${step.dayNumber}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default JourneyEditorPage;

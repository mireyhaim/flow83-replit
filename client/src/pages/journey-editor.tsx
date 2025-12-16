import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation, Link } from "wouter";
import JourneyStep from "@/components/journey/JourneyStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save, Eye, Loader2, Globe, GlobeLock, Calendar, Target, Users, ChevronLeft, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, stepApi, blockApi } from "@/lib/api";
import type { Journey, JourneyStep as JourneyStepType, JourneyBlock } from "@shared/schema";

type StepWithBlocks = JourneyStepType & { blocks: JourneyBlock[] };
type JourneyWithSteps = Journey & { steps: StepWithBlocks[] };

const JourneyEditorPage = () => {
  const [match, params] = useRoute("/journey/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [journeyData, setJourneyData] = useState<JourneyWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!journeyData?.steps.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step-id');
            if (stepId) setActiveStepId(stepId);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    stepRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [journeyData?.steps]);

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) return;
      try {
        const data = await journeyApi.getFull(params.id);
        const sortedSteps = data.steps.sort((a, b) => a.dayNumber - b.dayNumber);
        setJourneyData({ ...data, steps: sortedSteps });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load journey",
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save journey",
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
    } catch (error) {
      toast({
        title: "Error",
        description: newStatus === "published" ? "Failed to publish journey" : "Failed to unpublish journey",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const updateStep = async (stepId: string, updatedStep: Partial<JourneyStepType>) => {
    if (!journeyData) return;
    try {
      await stepApi.update(stepId, updatedStep);
      setJourneyData(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId ? { ...step, ...updatedStep } : step
        )
      } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update day",
        variant: "destructive",
      });
    }
  };

  const addStep = async () => {
    if (!journeyData) return;
    try {
      const newStep = await stepApi.create(journeyData.id, {
        dayNumber: journeyData.steps.length + 1,
        title: `Day ${journeyData.steps.length + 1}`,
        description: "",
      });
      setJourneyData(prev => prev ? {
        ...prev,
        steps: [...prev.steps, { ...newStep, blocks: [] }]
      } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add day",
        variant: "destructive",
      });
    }
  };

  const addBlock = async (stepId: string, type: string, content: any) => {
    if (!journeyData) return;
    try {
      const step = journeyData.steps.find(s => s.id === stepId);
      const newBlock = await blockApi.create(stepId, {
        type,
        content,
        orderIndex: step?.blocks.length || 0,
      });
      setJourneyData(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId 
            ? { ...step, blocks: [...step.blocks, newBlock] }
            : step
        )
      } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add block",
        variant: "destructive",
      });
    }
  };

  const updateBlock = async (blockId: string, content: any) => {
    if (!journeyData) return;
    try {
      await blockApi.update(blockId, { content });
      setJourneyData(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => ({
          ...step,
          blocks: step.blocks.map(block =>
            block.id === blockId ? { ...block, content } : block
          )
        }))
      } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update block",
        variant: "destructive",
      });
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!journeyData) return;
    try {
      await blockApi.delete(blockId);
      setJourneyData(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => ({
          ...step,
          blocks: step.blocks.filter(block => block.id !== blockId)
        }))
      } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete block",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Flow not found</h1>
          <Button onClick={() => setLocation("/journeys/new")} data-testid="button-create-new">
            Create New Flow
          </Button>
        </div>
      </div>
    );
  }

  const scrollToStep = (stepId: string) => {
    setActiveStepId(stepId);
    const element = document.getElementById(`step-${stepId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <header className="bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
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

      <main>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex gap-6">
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="py-3 px-4 border-b border-white/10">
                    <h3 className="text-sm font-medium text-white">Flow Days</h3>
                  </div>
                  <ScrollArea className="h-[calc(100vh-14rem)]">
                    <div className="p-2">
                      {journeyData.steps.map((step, index) => (
                        <button
                          key={step.id}
                          onClick={() => scrollToStep(step.id)}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-all hover:bg-white/5 ${
                            activeStepId === step.id ? 'bg-violet-500/20 border-l-2 border-violet-500' : ''
                          }`}
                          data-testid={`nav-step-${step.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              activeStepId === step.id 
                                ? 'bg-violet-600 text-white' 
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white leading-tight" style={{ wordBreak: 'break-word' }}>{step.title}</p>
                              <p className="text-xs text-white/40 mt-1">{step.blocks.length} blocks</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl mt-4 overflow-hidden">
                  <div className="py-3 px-4 border-b border-white/10">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-violet-400" />
                      Flow Goal
                    </h3>
                  </div>
                  <div className="py-3 px-4">
                    <p className="text-sm text-white/60 leading-relaxed" data-testid="text-journey-goal">
                      {journeyData.goal}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="space-y-4">
                {journeyData.steps.map((step, index) => (
                  <div 
                    key={step.id} 
                    id={`step-${step.id}`} 
                    data-step-id={step.id}
                    ref={(el) => { 
                      if (el) stepRefs.current.set(step.id, el); 
                      else stepRefs.current.delete(step.id);
                    }}
                    className="scroll-mt-36"
                  >
                    <JourneyStep
                      step={{
                        id: step.id,
                        day: step.dayNumber,
                        title: step.title,
                        description: step.description || "",
                        blocks: step.blocks.map(b => ({
                          id: b.id,
                          type: b.type,
                          content: typeof b.content === 'string' ? b.content : (b.content as any)?.text || ""
                        }))
                      }}
                      stepNumber={index + 1}
                      onUpdate={(updatedStep) => updateStep(step.id, {
                        title: updatedStep.title,
                        description: updatedStep.description,
                      })}
                      onAddBlock={(type, content) => addBlock(step.id, type, { text: content })}
                      onUpdateBlock={(blockId, content) => updateBlock(blockId, { text: content })}
                      onDeleteBlock={deleteBlock}
                    />
                  </div>
                ))}
                
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneyEditorPage;

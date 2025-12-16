import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/landing/Header";
import JourneyStep from "@/components/journey/JourneyStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save, Eye, Loader2, Globe, GlobeLock, Calendar, Target, Users, ChevronLeft } from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Journey not found</h1>
          <Button onClick={() => setLocation("/journeys/new")} data-testid="button-create-new">
            Create New Journey
          </Button>
        </main>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="pt-20">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/journeys")}
                  className="gap-2"
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="text-xl font-bold text-foreground" data-testid="text-journey-name">
                    {journeyData.name}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {journeyData.duration} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {journeyData.audience}
                    </span>
                    {journeyData.status === "published" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Globe className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="sm" onClick={handlePreview} className="gap-2" data-testid="button-preview">
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
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
                  className={journeyData.status === "published" ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}
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
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            <aside className="w-72 flex-shrink-0 hidden lg:block">
              <div className="sticky top-36">
                <Card className="overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-muted/50">
                    <CardTitle className="text-sm font-medium">Journey Days</CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="p-2">
                      {journeyData.steps.map((step, index) => (
                        <button
                          key={step.id}
                          onClick={() => scrollToStep(step.id)}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-all hover:bg-muted/80 ${
                            activeStepId === step.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                          data-testid={`nav-step-${step.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              activeStepId === step.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight" style={{ wordBreak: 'break-word' }}>{step.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{step.blocks.length} blocks</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={addStep} 
                        className="w-full mt-2 text-muted-foreground hover:text-foreground"
                        data-testid="button-add-day-sidebar"
                      >
                        + Add Day
                      </Button>
                    </div>
                  </ScrollArea>
                </Card>

                <Card className="mt-4">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Journey Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-journey-goal">
                      {journeyData.goal}
                    </p>
                  </CardContent>
                </Card>
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
                
                <div className="text-center py-8 lg:hidden">
                  <Button variant="outline" onClick={addStep} className="gap-2" data-testid="button-add-day">
                    + Add New Day
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneyEditorPage;

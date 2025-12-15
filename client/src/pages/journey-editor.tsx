import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/landing/Header";
import JourneyStep from "@/components/journey/JourneyStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
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
      toast({
        title: "Journey saved",
        description: "Your changes have been saved successfully.",
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
        description: "Failed to update step",
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
        description: "Failed to add step",
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
            Create a New Journey
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/journeys/new")}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Create
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-journey-name">
                  {journeyData.name}
                </h1>
                <p className="text-muted-foreground" data-testid="text-journey-meta">
                  {journeyData.duration} days • {journeyData.audience}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePreview} className="gap-2" data-testid="button-preview">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button 
                onClick={handleSave} 
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={isSaving}
                data-testid="button-save"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Journey Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Goal & Intention</h4>
                  <p className="text-muted-foreground" data-testid="text-journey-goal">{journeyData.goal}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Target Audience</h4>
                  <p className="text-muted-foreground" data-testid="text-journey-audience">{journeyData.audience}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {journeyData.steps.map((step, index) => (
              <JourneyStep
                key={step.id}
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
            ))}
            
            <div className="text-center">
              <Button variant="outline" onClick={addStep} className="gap-2" data-testid="button-add-day">
                + Add New Day
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneyEditorPage;

import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/landing/Header";
import JourneyStep from "@/components/journey/JourneyStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data structure - in real app this would come from API/database
const mockJourneyData = {
  id: "1",
  name: "Healing the Heart",
  goal: "To help people release emotional pain from past relationships",
  audience: "Women post-breakup",
  duration: 7,
  steps: [
    {
      id: "step-1",
      day: 1,
      title: "Acknowledging the Pain",
      description: "Begin your healing journey by recognizing and honoring your emotional experience",
      blocks: [
        {
          id: "block-1",
          type: "text",
          content: "Welcome to your healing journey. Today we begin by creating a safe space to acknowledge what you've been through."
        },
        {
          id: "block-2", 
          type: "question",
          content: "What emotions are you feeling right now as you begin this journey?"
        },
        {
          id: "block-3",
          type: "meditation",
          content: "5-minute grounding meditation to center yourself in this moment"
        }
      ]
    },
    {
      id: "step-2", 
      day: 2,
      title: "Understanding Your Patterns",
      description: "Explore the relationship patterns that no longer serve you",
      blocks: [
        {
          id: "block-4",
          type: "text",
          content: "Today we dive deeper into understanding how past experiences shape our current emotional landscape."
        },
        {
          id: "block-5",
          type: "task", 
          content: "Write a letter to your past self - what would you want her to know?"
        }
      ]
    }
  ]
};

const JourneyEditorPage = () => {
  const [match, params] = useRoute("/journey/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  // In a real app, we would use params.id to fetch data
  const [journeyData, setJourneyData] = useState(mockJourneyData);

  const handleSave = () => {
    toast({
      title: "Journey saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const handlePreview = () => {
    // Open preview in new tab or navigate to preview page
    window.open(`/p/${journeyData.id}`, '_blank');
  };

  const updateStep = (stepId: string, updatedStep: any) => {
    setJourneyData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updatedStep } : step
      )
    }));
  };

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      day: journeyData.steps.length + 1,
      title: `Day ${journeyData.steps.length + 1}`,
      description: "New step description",
      blocks: []
    };
    setJourneyData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/journeys/new")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Create
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {journeyData.name}
                </h1>
                <p className="text-muted-foreground">
                  {journeyData.duration} days • {journeyData.audience}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePreview} className="gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Journey Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Journey Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Goal & Intention</h4>
                  <p className="text-muted-foreground">{journeyData.goal}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Target Audience</h4>
                  <p className="text-muted-foreground">{journeyData.audience}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journey Steps */}
          <div className="space-y-6">
            {journeyData.steps.map((step, index) => (
              <JourneyStep
                key={step.id}
                step={step}
                stepNumber={index + 1}
                onUpdate={(updatedStep) => updateStep(step.id, updatedStep)}
              />
            ))}
            
            <div className="text-center">
              <Button variant="outline" onClick={addStep} className="gap-2">
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

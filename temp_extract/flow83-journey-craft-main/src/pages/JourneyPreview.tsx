import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import JourneyStepPreview from "@/components/JourneyStepPreview";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

// Mock data - in real app this would come from API
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
          content: "Welcome to your healing journey. Today we begin by creating a safe space to acknowledge what you've been through. This is a sacred time for you to honor your experience and begin the process of transformation."
        },
        {
          id: "block-2", 
          type: "question",
          content: "What emotions are you feeling right now as you begin this journey? Take a moment to notice what's arising in your body and heart."
        },
        {
          id: "block-3",
          type: "meditation",
          content: "5-minute grounding meditation: Sit comfortably and place one hand on your heart, the other on your belly. Breathe deeply and feel yourself supported by the earth beneath you. You are safe to feel whatever arises."
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
          content: "Today we dive deeper into understanding how past experiences shape our current emotional landscape. With compassion and curiosity, we'll explore the patterns that have protected you but may no longer serve your highest good."
        },
        {
          id: "block-5",
          type: "task", 
          content: "Write a letter to your past self - what would you want her to know? What wisdom would you share? What love would you offer?"
        }
      ]
    },
    {
      id: "step-3",
      day: 3,
      title: "Releasing and Letting Go",
      description: "Create space for new love by releasing what no longer serves",
      blocks: [
        {
          id: "block-6",
          type: "text",
          content: "Today is about creating space. Like clearing out an old closet to make room for beautiful new clothes, we're going to practice releasing what no longer fits in your life."
        }
      ]
    }
  ]
};

const JourneyPreview = () => {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [journeyData] = useState(mockJourneyData);

  const progress = ((currentStep + 1) / journeyData.steps.length) * 100;

  const goToNextStep = () => {
    if (currentStep < journeyData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  useEffect(() => {
    // Smooth scroll to top when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {journeyData.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Day {currentStep + 1} of {journeyData.duration}
              </p>
            </div>
            <Button variant="ghost" className="gap-2">
              <Home className="w-4 h-4" />
              Exit Journey
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Step Navigation Dots */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {journeyData.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-primary scale-125' 
                      : index < currentStep 
                        ? 'bg-primary/60' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Step */}
          <Card className="shadow-spiritual mb-8">
            <CardContent className="p-0">
              <JourneyStepPreview 
                step={journeyData.steps[currentStep]}
                stepNumber={currentStep + 1}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Day
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Day {currentStep + 1} of {journeyData.duration}
              </p>
            </div>

            {currentStep < journeyData.steps.length - 1 ? (
              <Button onClick={goToNextStep} className="gap-2">
                Next Day
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                Complete Journey
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneyPreview;
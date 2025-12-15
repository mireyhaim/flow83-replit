import { useState } from "react";
import Header from "@/components/landing/Header";
import JourneyIntentForm from "@/components/journey/JourneyIntentForm";
import ContentUploadSection from "@/components/journey/ContentUploadSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JourneyCreatePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyData, setJourneyData] = useState({});

  const handleIntentComplete = (data: any) => {
    setJourneyData(data);
    setCurrentStep(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Let's create your personal journey
            </h1>
            <p className="text-xl text-muted-foreground">
              Guide your clients through a transformative process with Flow 83
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </div>

          <Card className="shadow-spiritual">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentStep === 1 ? "Step 1: Intent & Context" : "Step 2: Upload & Share Your Content"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 ? (
                <JourneyIntentForm onComplete={handleIntentComplete} />
              ) : (
                <ContentUploadSection journeyData={journeyData} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JourneyCreatePage;

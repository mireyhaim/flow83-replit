import { useState } from "react";
import { Link } from "wouter";
import JourneyIntentForm from "@/components/journey/JourneyIntentForm";
import ContentUploadSection from "@/components/journey/ContentUploadSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

const JourneyCreatePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyData, setJourneyData] = useState({});

  const handleIntentComplete = (data: any) => {
    setJourneyData(data);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <header className="bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center h-16">
            <Link href="/journeys" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-my-flows">
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">My Flows</span>
            </Link>
            <div className="h-5 w-px bg-white/10 mx-4" />
            <h1 className="text-lg font-semibold text-white">Create New Flow</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
            Let's create your personal flow
          </h2>
          <p className="text-lg text-white/60">
            Guide your clients through a transformative process
          </p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep >= 1 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/40'
            }`} data-testid="step-indicator-1">
              1
            </div>
            <div className={`w-16 h-1 rounded ${currentStep >= 2 ? 'bg-violet-600' : 'bg-white/10'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep >= 2 ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/40'
            }`} data-testid="step-indicator-2">
              2
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <h3 className="text-lg font-semibold text-white text-center">
              {currentStep === 1 ? "Step 1: Intent & Context" : "Step 2: Upload & Share Your Content"}
            </h3>
          </div>
          <div className="p-6">
            {currentStep === 1 ? (
              <JourneyIntentForm onComplete={handleIntentComplete} initialData={journeyData} />
            ) : (
              <ContentUploadSection journeyData={journeyData} onBack={handleBack} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneyCreatePage;

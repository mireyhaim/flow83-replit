import { useState } from "react";
import { Link } from "wouter";
import JourneyIntentForm from "@/components/journey/JourneyIntentForm";
import ContentUploadSection from "@/components/journey/ContentUploadSection";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

const JourneyCreatePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyData, setJourneyData] = useState({});
  const { t } = useTranslation('dashboard');

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
              <span className="text-sm font-medium">{t('journeyCreate.myFlows')}</span>
            </Link>
            <div className="h-5 w-px bg-white/10 mx-4" />
            <h1 className="text-lg font-semibold text-white">{t('journeyCreate.createNewFlow')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 1 ? (
          <JourneyIntentForm onComplete={handleIntentComplete} initialData={journeyData} />
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {t('journeyCreate.uploadYourContent')}
              </h2>
              <p className="text-white/60">
                {t('journeyCreate.shareYourTeachings')}
              </p>
            </div>
            <ContentUploadSection journeyData={journeyData} onBack={handleBack} />
          </div>
        )}
      </main>
    </div>
  );
};

export default JourneyCreatePage;

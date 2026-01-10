import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, User, MessageSquare } from "lucide-react";

export interface OnboardingConfig {
  addressing_style: "female" | "male" | "neutral";
  tone_preference: "direct" | "balanced" | "soft";
}

interface PreChatOnboardingProps {
  onComplete: (config: OnboardingConfig) => void;
  journeyName?: string;
}

interface OnboardingStep {
  id: keyof OnboardingConfig;
  icon: React.ComponentType<{ className?: string }>;
  question: string;
  options: { value: string; label: string }[];
}

const steps: OnboardingStep[] = [
  {
    id: "addressing_style",
    icon: User,
    question: "איך נוח לך שאדבר אלייך בתהליך הזה?",
    options: [
      { value: "female", label: "בלשון נקבה" },
      { value: "male", label: "בלשון זכר" },
      { value: "neutral", label: "לא משנה" },
    ],
  },
  {
    id: "tone_preference",
    icon: MessageSquare,
    question: "איזה סגנון הכי מדויק לך לתהליך כזה?",
    options: [
      { value: "direct", label: "ישיר וקצר" },
      { value: "balanced", label: "מאוזן" },
      { value: "soft", label: "רך ותומך" },
    ],
  },
];

export function PreChatOnboarding({ onComplete, journeyName }: PreChatOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<Partial<OnboardingConfig>>({});

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = config[step.id] !== undefined;

  const handleSelect = (value: string) => {
    setConfig(prev => ({ ...prev, [step.id]: value }));
  };

  const handleNext = () => {
    if (isLastStep && canProceed) {
      onComplete(config as OnboardingConfig);
    } else if (canProceed) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            {journeyName || "ברוכים הבאים"}
          </h1>
          <p className="text-violet-300/80 text-sm">
            כמה שאלות קצרות לפני שמתחילים
          </p>
        </motion.div>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                idx <= currentStep ? "bg-violet-500" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-medium text-white">{step.question}</h2>
            </div>

            <div className="space-y-3">
              {step.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  data-testid={`onboarding-option-${option.value}`}
                  className={`w-full text-right p-4 rounded-xl border transition-all ${
                    config[step.id] === option.value
                      ? "border-violet-500 bg-violet-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="text-white/60 hover:text-white"
                data-testid="onboarding-back"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-violet-600 hover:bg-violet-500 text-white"
                data-testid="onboarding-next"
              >
                {isLastStep ? "בואו נתחיל" : "הבא"}
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-white/40 text-xs mt-6">
          ההעדפות שלך עוזרות לנו להתאים את החוויה
        </p>
      </div>
    </div>
  );
}

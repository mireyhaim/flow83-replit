import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface JourneyIntentFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const JourneyIntentForm = ({ onComplete, initialData }: JourneyIntentFormProps) => {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const { t, i18n } = useTranslation('dashboard');
  const [formData, setFormData] = useState({
    profession: initialData?.profession || "",
    journeyName: initialData?.journeyName || "",
    targetAudience: initialData?.targetAudience || "",
    clientChallenges: initialData?.clientChallenges || "",
    mainGoal: initialData?.mainGoal || "",
    duration: initialData?.duration?.[0]?.toString() || "7",
    tone: initialData?.tone || "",
    desiredFeeling: initialData?.desiredFeeling || "",
    additionalNotes: initialData?.additionalNotes || "",
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
  };

  const professionOptions = [
    { value: "therapist", label: t('journeyCreate.professionTherapist') },
    { value: "coach", label: t('journeyCreate.professionCoach') },
    { value: "healer", label: t('journeyCreate.professionHealer') },
    { value: "mentor", label: t('journeyCreate.professionMentor') },
    { value: "counselor", label: t('journeyCreate.professionCounselor') },
    { value: "other", label: t('journeyCreate.professionOther') },
  ];

  const toneOptions = [
    { value: "warm", label: t('journeyCreate.toneWarm') },
    { value: "professional", label: t('journeyCreate.toneProfessional') },
    { value: "direct", label: t('journeyCreate.toneDirect') },
    { value: "gentle", label: t('journeyCreate.toneGentle') },
    { value: "motivating", label: t('journeyCreate.toneMotivating') },
    { value: "spiritual", label: t('journeyCreate.toneSpiritual') },
  ];

  const durationOptions = [
    { value: "3", label: t('journeyCreate.duration3Days'), description: t('journeyCreate.duration3DaysDesc') },
    { value: "7", label: t('journeyCreate.duration7Days'), description: t('journeyCreate.duration7DaysDesc') },
  ];

  const steps = [
    {
      id: "profession",
      title: t('journeyCreate.professionTitle'),
      subtitle: t('journeyCreate.professionSubtitle'),
      type: "select",
      field: "profession",
      options: professionOptions,
      required: true,
    },
    {
      id: "journeyName",
      title: t('journeyCreate.journeyNameTitle'),
      subtitle: t('journeyCreate.journeyNameSubtitle'),
      type: "text",
      field: "journeyName",
      placeholder: t('journeyCreate.journeyNamePlaceholder'),
      required: true,
    },
    {
      id: "targetAudience",
      title: t('journeyCreate.targetAudienceTitle'),
      subtitle: t('journeyCreate.targetAudienceSubtitle'),
      type: "text",
      field: "targetAudience",
      placeholder: t('journeyCreate.targetAudiencePlaceholder'),
      required: true,
    },
    {
      id: "clientChallenges",
      title: t('journeyCreate.clientChallengesTitle'),
      subtitle: t('journeyCreate.clientChallengesSubtitle'),
      type: "textarea",
      field: "clientChallenges",
      placeholder: t('journeyCreate.clientChallengesPlaceholder'),
      required: false,
    },
    {
      id: "mainGoal",
      title: t('journeyCreate.mainGoalTitle'),
      subtitle: t('journeyCreate.mainGoalSubtitle'),
      type: "textarea",
      field: "mainGoal",
      placeholder: t('journeyCreate.mainGoalPlaceholder'),
      required: true,
      minLength: 10,
      errorMessage: t('journeyCreate.mainGoalError'),
    },
    {
      id: "duration",
      title: t('journeyCreate.durationTitle'),
      subtitle: t('journeyCreate.durationSubtitle'),
      type: "cards",
      field: "duration",
      options: durationOptions,
      required: true,
    },
    {
      id: "tone",
      title: t('journeyCreate.toneTitle'),
      subtitle: t('journeyCreate.toneSubtitle'),
      type: "select",
      field: "tone",
      options: toneOptions,
      required: true,
    },
    {
      id: "desiredFeeling",
      title: t('journeyCreate.desiredFeelingTitle'),
      subtitle: t('journeyCreate.desiredFeelingSubtitle'),
      type: "textarea",
      field: "desiredFeeling",
      placeholder: t('journeyCreate.desiredFeelingPlaceholder'),
      required: false,
    },
    {
      id: "additionalNotes",
      title: t('journeyCreate.additionalNotesTitle'),
      subtitle: t('journeyCreate.additionalNotesSubtitle'),
      type: "textarea",
      field: "additionalNotes",
      placeholder: t('journeyCreate.additionalNotesPlaceholder'),
      required: false,
    },
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepData = steps[currentStep];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = () => {
    const step = currentStepData as any;
    const value = formData[step.field as keyof typeof formData];
    
    if (step.required && (!value || value.length === 0)) {
      return t('journeyCreate.thisFieldRequired');
    }
    
    if (step.minLength && value.length < step.minLength) {
      return step.errorMessage || t('journeyCreate.minimumCharsRequired', { count: step.minLength });
    }
    
    return null;
  };

  const canProceed = () => {
    return validateStep() === null;
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError("");
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete({ ...formData, duration: [parseInt(formData.duration)] });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate("/journeys");
    }
  };

  const renderStepContent = () => {
    const step = currentStepData;
    const value = formData[step.field as keyof typeof formData];

    switch (step.type) {
      case "select":
        return (
          <div className="grid grid-cols-2 gap-3">
            {step.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField(step.field, option.value)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  value === option.value
                    ? "border-violet-500 bg-violet-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
                data-testid={`option-${step.field}-${option.value}`}
              >
                <span className="text-white font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case "cards":
        return (
          <div className="grid grid-cols-2 gap-4">
            {step.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField(step.field, option.value)}
                className={`p-6 rounded-xl border-2 transition-all text-center ${
                  value === option.value
                    ? "border-violet-500 bg-violet-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
                data-testid={`option-${step.field}-${option.value}`}
              >
                <span className="text-white font-bold text-xl block">{option.label}</span>
                {"description" in option && (
                  <span className="text-white/50 text-sm">{(option as any).description}</span>
                )}
              </button>
            ))}
          </div>
        );

      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => updateField(step.field, e.target.value)}
            placeholder={step.placeholder}
            className="text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 h-14 rounded-xl"
            data-testid={`input-${step.field}`}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => updateField(step.field, e.target.value)}
            placeholder={step.placeholder}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-lg"
            data-testid={`textarea-${step.field}`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-sm">
            {t('journeyCreate.stepOf', { current: currentStep + 1, total: totalSteps })}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
              data-testid="button-toggle-language"
            >
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'he' ? 'EN' : 'עב'}</span>
            </button>
            <span className="text-white/50 text-sm">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-white/10" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-white/60">{currentStepData.subtitle}</p>
          </div>

          {renderStepContent()}
          
          {(() => {
            if (error) {
              return (
                <div className="text-red-400 text-sm text-center mt-4" data-testid="error-message">
                  {error}
                </div>
              );
            }
            const validationError = validateStep();
            if (validationError && formData[currentStepData.field as keyof typeof formData].length > 0) {
              return (
                <div className="text-amber-400 text-sm text-center mt-4" data-testid="validation-hint">
                  {validationError}
                </div>
              );
            }
            return null;
          })()}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-10">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="text-white/60 hover:text-white hover:bg-white/10"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4 me-2" />
          {t('journeyCreate.back')}
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          className="bg-violet-600 hover:bg-violet-700 px-8 disabled:opacity-50"
          data-testid="button-next"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Sparkles className="w-4 h-4 me-2" />
              {t('journeyCreate.continue')}
            </>
          ) : (
            <>
              {t('journeyCreate.next')}
              <ChevronRight className="w-4 h-4 ms-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default JourneyIntentForm;

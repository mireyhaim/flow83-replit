import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  Sparkles, 
  Globe, 
  UserCircle, 
  Pencil, 
  Users, 
  Target, 
  Calendar,
  Heart,
  MessageCircle,
  FileText,
  Check
} from "lucide-react";
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
  const { t } = useTranslation('dashboard');
  const [formData, setFormData] = useState({
    language: initialData?.language || "",
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

  const languageOptions = [
    { value: "he", label: t('journeyCreate.languageHebrew'), icon: "🇮🇱" },
    { value: "en", label: t('journeyCreate.languageEnglish'), icon: "🇺🇸" },
  ];

  const professionOptions = [
    { value: "therapist", label: t('journeyCreate.professionTherapist'), icon: "🧠" },
    { value: "coach", label: t('journeyCreate.professionCoach'), icon: "🎯" },
    { value: "healer", label: t('journeyCreate.professionHealer'), icon: "✨" },
    { value: "mentor", label: t('journeyCreate.professionMentor'), icon: "🌟" },
    { value: "counselor", label: t('journeyCreate.professionCounselor'), icon: "💬" },
    { value: "other", label: t('journeyCreate.professionOther'), icon: "🌀" },
  ];

  const toneOptions = [
    { value: "warm", label: t('journeyCreate.toneWarm'), icon: "☀️" },
    { value: "professional", label: t('journeyCreate.toneProfessional'), icon: "💼" },
    { value: "direct", label: t('journeyCreate.toneDirect'), icon: "🎯" },
    { value: "gentle", label: t('journeyCreate.toneGentle'), icon: "🌸" },
    { value: "motivating", label: t('journeyCreate.toneMotivating'), icon: "🔥" },
    { value: "spiritual", label: t('journeyCreate.toneSpiritual'), icon: "🕊️" },
  ];

  const durationOptions = [
    { value: "3", label: t('journeyCreate.duration3Days'), description: t('journeyCreate.duration3DaysDesc'), icon: "⚡" },
    { value: "7", label: t('journeyCreate.duration7Days'), description: t('journeyCreate.duration7DaysDesc'), icon: "🌈" },
  ];

  const stepIcons = [Globe, UserCircle, Pencil, Users, Target, Target, Calendar, MessageCircle, Heart, FileText];

  const steps = [
    {
      id: "language",
      title: t('journeyCreate.languageTitle'),
      subtitle: t('journeyCreate.languageSubtitle'),
      type: "language",
      field: "language",
      options: languageOptions,
      required: true,
      tip: t('journeyCreate.languageTip'),
    },
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
      case "language":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {step.options?.map((option, idx) => (
                <motion.button
                  key={option.value}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => updateField(step.field, option.value)}
                  className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                    value === option.value
                      ? "border-violet-500 bg-gradient-to-br from-violet-500/20 to-violet-600/10 shadow-lg shadow-violet-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                  data-testid={`option-${step.field}-${option.value}`}
                >
                  {value === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 end-3 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <span className="text-4xl block mb-3">{(option as any).icon}</span>
                  <span className="text-white font-bold text-xl block">{option.label}</span>
                </motion.button>
              ))}
            </div>
            {"tip" in step && step.tip && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-amber-400/80 text-sm bg-amber-400/10 rounded-xl py-3 px-4"
              >
                💡 {step.tip}
              </motion.p>
            )}
          </div>
        );

      case "select":
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {step.options?.map((option, idx) => (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => updateField(step.field, option.value)}
                className={`group relative p-5 rounded-xl border-2 transition-all duration-200 ${
                  value === option.value
                    ? "border-violet-500 bg-gradient-to-br from-violet-500/20 to-violet-600/10"
                    : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                }`}
                data-testid={`option-${step.field}-${option.value}`}
              >
                {value === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 end-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                <span className="text-2xl block mb-2">{(option as any).icon}</span>
                <span className="text-white font-medium text-sm">{option.label}</span>
              </motion.button>
            ))}
          </div>
        );

      case "cards":
        return (
          <div className="grid grid-cols-2 gap-4">
            {step.options?.map((option, idx) => (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => updateField(step.field, option.value)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-start ${
                  value === option.value
                    ? "border-violet-500 bg-gradient-to-br from-violet-500/20 to-violet-600/10 shadow-lg shadow-violet-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                }`}
                data-testid={`option-${step.field}-${option.value}`}
              >
                {value === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 end-3 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
                <span className="text-3xl block mb-3">{(option as any).icon}</span>
                <span className="text-white font-bold text-xl block mb-1">{option.label}</span>
                {"description" in option && (
                  <span className="text-white/50 text-sm">{(option as any).description}</span>
                )}
              </motion.button>
            ))}
          </div>
        );

      case "text":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Input
              value={value}
              onChange={(e) => updateField(step.field, e.target.value)}
              placeholder={step.placeholder}
              className="text-lg bg-white/5 border-white/20 text-white placeholder:text-white/40 h-16 rounded-2xl px-6 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              data-testid={`input-${step.field}`}
            />
          </motion.div>
        );

      case "textarea":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Textarea
              value={value}
              onChange={(e) => updateField(step.field, e.target.value)}
              placeholder={step.placeholder}
              className="min-h-[140px] bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-2xl text-lg p-5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
              data-testid={`textarea-${step.field}`}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const StepIcon = stepIcons[currentStep] || Globe;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white/40 text-xs uppercase tracking-wider">
                {t('journeyCreate.stepOf', { current: currentStep + 1, total: totalSteps })}
              </span>
              <div className="text-white font-medium text-sm">{currentStepData.id}</div>
            </div>
          </div>
          <div className="text-violet-400 font-bold text-lg">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 start-0 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex justify-between mt-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < currentStep 
                  ? "bg-violet-500" 
                  : idx === currentStep 
                    ? "bg-violet-400 ring-4 ring-violet-500/20" 
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-white mb-3"
            >
              {currentStepData.title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-lg"
            >
              {currentStepData.subtitle}
            </motion.p>
          </div>

          {renderStepContent()}
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3 px-4"
                data-testid="error-message"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-12">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="text-white/60 hover:text-white hover:bg-white/10 h-12 px-6 rounded-xl"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4 me-2" />
          {t('journeyCreate.back')}
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 h-12 px-8 rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
          data-testid="button-next"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Sparkles className="w-4 h-4 me-2" />
              {t('journeyCreate.continue')}
            </>
          ) : (
            t('journeyCreate.next')
          )}
        </Button>
      </div>
    </div>
  );
};

export default JourneyIntentForm;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const professionOptions = [
  { value: "therapist", label: "Therapist" },
  { value: "coach", label: "Coach" },
  { value: "healer", label: "Healer" },
  { value: "mentor", label: "Mentor" },
  { value: "counselor", label: "Counselor" },
  { value: "other", label: "Other" },
];

const toneOptions = [
  { value: "warm", label: "Warm & Personal" },
  { value: "professional", label: "Professional" },
  { value: "direct", label: "Direct & Clear" },
  { value: "gentle", label: "Gentle & Soft" },
  { value: "motivating", label: "Motivating & Energetic" },
  { value: "spiritual", label: "Spiritual & Deep" },
];

const durationOptions = [
  { value: "3", label: "3 Days", description: "Quick transformation" },
  { value: "7", label: "7 Days", description: "Deep journey" },
];

interface JourneyIntentFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const JourneyIntentForm = ({ onComplete, initialData }: JourneyIntentFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
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

  const steps = [
    {
      id: "profession",
      title: "What is your profession?",
      subtitle: "Help us understand your background",
      type: "select",
      field: "profession",
      options: professionOptions,
      required: true,
    },
    {
      id: "journeyName",
      title: "What's the name of your flow?",
      subtitle: "Give your transformation a memorable name",
      type: "text",
      field: "journeyName",
      placeholder: 'e.g., "Healing the Heart"',
      required: true,
    },
    {
      id: "targetAudience",
      title: "Who is this flow for?",
      subtitle: "Describe your ideal participant",
      type: "text",
      field: "targetAudience",
      placeholder: 'e.g., "Women post-breakup", "Teens dealing with anxiety"',
      required: true,
    },
    {
      id: "clientChallenges",
      title: "What challenges do your clients face?",
      subtitle: "Describe their main pain points and struggles",
      type: "textarea",
      field: "clientChallenges",
      placeholder: 'e.g., "Anxiety after breakups, difficulty letting go, fear of being alone"',
      required: false,
    },
    {
      id: "mainGoal",
      title: "What is the main goal of this flow?",
      subtitle: "What transformation do you want to create?",
      type: "textarea",
      field: "mainGoal",
      placeholder: 'e.g., "To help people release emotional pain and find inner peace"',
      required: true,
      minLength: 10,
      errorMessage: "Please provide a detailed goal (minimum 10 characters)",
    },
    {
      id: "duration",
      title: "How many days?",
      subtitle: "Choose the length of the journey",
      type: "cards",
      field: "duration",
      options: durationOptions,
      required: true,
    },
    {
      id: "tone",
      title: "What tone fits your clients?",
      subtitle: "How should the content feel?",
      type: "select",
      field: "tone",
      options: toneOptions,
      required: true,
    },
    {
      id: "desiredFeeling",
      title: "How should users feel at the end?",
      subtitle: "Describe the emotional transformation",
      type: "textarea",
      field: "desiredFeeling",
      placeholder: 'e.g., "Clear, safe, grounded, empowered"',
      required: false,
    },
    {
      id: "additionalNotes",
      title: "Anything else to share?",
      subtitle: "Share your vision, energy, or special intentions",
      type: "textarea",
      field: "additionalNotes",
      placeholder: 'e.g., "I want it to feel like entering a sacred temple"',
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
      return "This field is required";
    }
    
    if (step.minLength && value.length < step.minLength) {
      return step.errorMessage || `Minimum ${step.minLength} characters required`;
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
          <span className="text-white/50 text-sm">Step {currentStep + 1} of {totalSteps}</span>
          <span className="text-white/50 text-sm">{Math.round(progress)}%</span>
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
          disabled={currentStep === 0}
          className="text-white/60 hover:text-white hover:bg-white/10"
          data-testid="button-back"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          className="bg-indigo-600 hover:bg-indigo-700 px-8 disabled:opacity-50"
          data-testid="button-next"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Continue
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default JourneyIntentForm;

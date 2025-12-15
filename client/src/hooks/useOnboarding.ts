import { useState, useEffect, useCallback } from "react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Flow 83!",
    description: "Let's take a quick tour to help you create your first transformational journey.",
    position: "bottom",
  },
  {
    id: "create-journey",
    title: "Create Your First Journey",
    description: "Click here to start building a 7-day transformational experience for your participants.",
    targetSelector: '[data-testid="button-create-journey"]',
    position: "left",
  },
  {
    id: "stats",
    title: "Track Your Progress",
    description: "Monitor your journeys, participants, and completion rates from the dashboard.",
    targetSelector: '[data-testid="card-total-journeys"]',
    position: "bottom",
  },
  {
    id: "journeys-list",
    title: "Manage Your Journeys",
    description: "View and edit all your journeys here. You can have multiple active journeys.",
    targetSelector: '[data-testid^="card-journey-"], [data-testid="button-create-first-journey"]',
    position: "right",
  },
];

const STORAGE_KEY = "flow83_onboarding";

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  hasSeenOnboarding: boolean;
}

const getInitialState = (): OnboardingState => {
  if (typeof window === "undefined") {
    return { isActive: false, currentStep: 0, isCompleted: false, hasSeenOnboarding: false };
  }
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { isActive: false, currentStep: 0, isCompleted: false, hasSeenOnboarding: false };
    }
  }
  return { isActive: false, currentStep: 0, isCompleted: false, hasSeenOnboarding: false };
};

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const startOnboarding = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      isCompleted: false,
      hasSeenOnboarding: true,
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= ONBOARDING_STEPS.length - 1) {
        return { ...prev, isActive: false, isCompleted: true };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      isCompleted: true,
      hasSeenOnboarding: true,
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState({
      isActive: false,
      currentStep: 0,
      isCompleted: false,
      hasSeenOnboarding: false,
    });
  }, []);

  const currentStepData = ONBOARDING_STEPS[state.currentStep] || null;
  const totalSteps = ONBOARDING_STEPS.length;
  const isLastStep = state.currentStep === totalSteps - 1;
  const isFirstStep = state.currentStep === 0;

  return {
    isActive: state.isActive,
    currentStep: state.currentStep,
    currentStepData,
    totalSteps,
    isLastStep,
    isFirstStep,
    isCompleted: state.isCompleted,
    hasSeenOnboarding: state.hasSeenOnboarding,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    resetOnboarding,
  };
}

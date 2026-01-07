import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, Sparkles } from "lucide-react";
import type { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingOverlayProps {
  isActive: boolean;
  currentStep: number;
  currentStepData: OnboardingStep | null;
  totalSteps: number;
  isLastStep: boolean;
  isFirstStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function OnboardingOverlay({
  isActive,
  currentStep,
  currentStepData,
  totalSteps,
  isLastStep,
  isFirstStep,
  onNext,
  onPrev,
  onSkip,
}: OnboardingOverlayProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let foundElement = false;

    const findTargetElement = (): Element | null => {
      if (!currentStepData.targetSelector) return null;
      const selectors = currentStepData.targetSelector.split(", ");
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
      return null;
    };

    const updatePosition = () => {
      const targetElement = findTargetElement();

      if (targetElement) {
        foundElement = true;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }

        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);

        const padding = 16;
        const tooltipWidth = 320;
        const tooltipHeight = 200;

        let top = 0;
        let left = 0;

        switch (currentStepData.position) {
          case "top":
            top = rect.top - tooltipHeight - padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding;
            break;
          default:
            top = rect.bottom + padding;
            left = rect.left;
        }

        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

        setTooltipPosition({ top, left });
      } else if (currentStepData.targetSelector) {
        setHighlightRect(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 160,
        });
      } else {
        setHighlightRect(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 160,
        });
      }
    };

    updatePosition();

    if (currentStepData.targetSelector && !foundElement) {
      pollInterval = setInterval(updatePosition, 200);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isActive, currentStepData, currentStep]);

  if (!isActive || !currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-auto"
        data-testid="onboarding-overlay"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-primary rounded-lg pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: "0 0 0 4px rgba(var(--primary), 0.2)",
            }}
          />
        )}

        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute w-80"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <Card className="shadow-2xl border-primary/20" data-testid="onboarding-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg" data-testid="onboarding-title">
                    {currentStepData.title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSkip}
                  data-testid="button-skip-onboarding"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm" data-testid="onboarding-description">
                {currentStepData.description}
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-0">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i === currentStep ? "bg-primary" : "bg-muted"
                    }`}
                    data-testid={`onboarding-step-indicator-${i}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onNext}
                  data-testid="button-next-step"
                >
                  {isLastStep ? "Finish" : "Next"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

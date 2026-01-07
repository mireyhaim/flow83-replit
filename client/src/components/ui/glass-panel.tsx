import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "highlight";
  padding?: "none" | "sm" | "md" | "lg";
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const variants = {
      default: "bg-white/5 border-white/10",
      subtle: "bg-white/[0.02] border-white/5",
      highlight: "bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border backdrop-blur-sm",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

interface GradientHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

const GradientHeader = React.forwardRef<HTMLDivElement, GradientHeaderProps>(
  ({ className, icon, title, subtitle, size = "md", ...props }, ref) => {
    const sizes = {
      sm: { icon: "w-12 h-12", iconInner: "w-6 h-6", title: "text-xl", subtitle: "text-sm" },
      md: { icon: "w-16 h-16", iconInner: "w-8 h-8", title: "text-2xl", subtitle: "text-base" },
      lg: { icon: "w-20 h-20", iconInner: "w-10 h-10", title: "text-3xl", subtitle: "text-lg" },
    };

    const s = sizes[size];

    return (
      <div ref={ref} className={cn("text-center", className)} {...props}>
        {icon && (
          <div className={cn(
            "rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-violet-600/25",
            s.icon
          )}>
            <span className={cn("text-white", s.iconInner)}>{icon}</span>
          </div>
        )}
        <h2 className={cn("font-bold text-white mb-2", s.title)}>{title}</h2>
        {subtitle && <p className={cn("text-white/60", s.subtitle)}>{subtitle}</p>}
      </div>
    );
  }
);
GradientHeader.displayName = "GradientHeader";

interface StepIndicatorProps {
  steps: { id: number; label: string }[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick || currentStep < step.id}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                currentStep > step.id && "bg-emerald-500 text-white",
                currentStep === step.id && "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 scale-110",
                currentStep < step.id && "bg-white/10 text-white/40",
                onStepClick && currentStep >= step.id && "cursor-pointer hover:scale-105"
              )}
            >
              {currentStep > step.id ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </button>
            <span className={cn(
              "text-xs hidden md:block",
              currentStep >= step.id ? "text-white/80" : "text-white/40"
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-8 md:w-12 h-0.5 mx-1 md:mx-2 mt-[-20px]",
              currentStep > step.id ? "bg-emerald-500" : "bg-white/20"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

export { GlassPanel, GradientHeader, StepIndicator };

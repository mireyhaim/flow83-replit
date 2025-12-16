import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { useQuery } from "@tanstack/react-query";
import { journeyApi, statsApi, type DashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, CheckCircle, BookOpen, Loader2, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Journey } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const onboarding = useOnboarding();

  useEffect(() => {
    if (isAuthenticated && !onboarding.hasSeenOnboarding && !onboarding.isActive) {
      const timer = setTimeout(() => {
        onboarding.startOnboarding();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, onboarding.hasSeenOnboarding, onboarding.isActive]);

  const { data: journeys = [], isLoading: journeysLoading } = useQuery<Journey[]>({
    queryKey: ["/api/journeys/my"],
    queryFn: journeyApi.getMy,
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    queryFn: statsApi.getDashboard,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-md text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Flow 83</h1>
          <p className="text-muted-foreground mb-8">
            Transform your knowledge into powerful 7-day journeys that help others grow.
          </p>
          <Button size="lg" asChild data-testid="button-login">
            <a href="/api/login">Sign In to Get Started</a>
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = journeysLoading || statsLoading;

  return (
    <DashboardLayout>
      <OnboardingOverlay
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        currentStepData={onboarding.currentStepData}
        totalSteps={onboarding.totalSteps}
        isLastStep={onboarding.isLastStep}
        isFirstStep={onboarding.isFirstStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipOnboarding}
      />

      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1" data-testid="text-welcome-message">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
          </div>
          {onboarding.hasSeenOnboarding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onboarding.startOnboarding}
              className="text-muted-foreground"
              data-testid="button-start-tutorial"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Tutorial
            </Button>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
            <Card className="bg-background border" data-testid="card-total-journeys">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-semibold mb-1" data-testid="text-total-journeys">{stats?.totalJourneys ?? 0}</div>
                <p className="text-sm text-muted-foreground">Journeys</p>
              </CardContent>
            </Card>
            <Card className="bg-background border" data-testid="card-total-participants">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="text-2xl font-semibold mb-1" data-testid="text-total-participants">{stats?.totalParticipants ?? 0}</div>
                <p className="text-sm text-muted-foreground">Participants</p>
              </CardContent>
            </Card>
            <Card className="bg-background border" data-testid="card-active-participants">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="text-2xl font-semibold mb-1" data-testid="text-active-participants">{stats?.activeParticipants ?? 0}</div>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </CardContent>
            </Card>
            <Card className="bg-background border" data-testid="card-completion-rate">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="text-2xl font-semibold mb-1" data-testid="text-completion-rate">{stats?.completionRate ?? 0}%</div>
                <p className="text-sm text-muted-foreground">Completion</p>
              </CardContent>
            </Card>
          </div>

          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Journeys</h2>
              {journeys.length > 0 && (
                <Link href="/journeys">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-view-all-journeys">
                    View All <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
            
            {journeys.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">No journeys yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Create your first 7-day transformational journey</p>
                  <Link href="/journeys/new">
                    <Button data-testid="button-create-first-journey">
                      Create Journey <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {journeys.slice(0, 6).map((journey) => (
                  <Card 
                    key={journey.id} 
                    className="group hover:shadow-md transition-all duration-200 hover:border-primary/30"
                    data-testid={`card-journey-${journey.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="font-medium line-clamp-2">{journey.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          journey.status === "published" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {journey.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                      <Link href={`/journeys/${journey.id}/edit`}>
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" data-testid={`button-edit-journey-${journey.id}`}>
                          Edit Journey
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { useQuery } from "@tanstack/react-query";
import { statsApi, activityApi, participantsApi, type DashboardStats, type InactiveParticipant } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, CheckCircle, BookOpen, Loader2, TrendingUp, HelpCircle, DollarSign, Lightbulb, Sparkles, Target, MessageCircle, Clock, AlertCircle, UserPlus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { ActivityEvent } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    queryFn: statsApi.getDashboard,
    enabled: isAuthenticated,
  });

  const { data: recentActivity = [] } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/activity/recent"],
    queryFn: activityApi.getRecent,
    enabled: isAuthenticated,
  });

  const { data: inactiveParticipants = [] } = useQuery<InactiveParticipant[]>({
    queryKey: ["/api/participants/inactive"],
    queryFn: () => participantsApi.getInactive(3),
    enabled: isAuthenticated,
  });

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'joined': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'completed_day': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed_journey': return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'feedback': return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (event: ActivityEvent) => {
    const data = event.eventData as { userName?: string; journeyName?: string; dayNumber?: number } | null;
    switch (event.eventType) {
      case 'joined': return `${data?.userName || 'Someone'} joined "${data?.journeyName || 'a journey'}"`;
      case 'completed_day': return `${data?.userName || 'Someone'} completed day ${data?.dayNumber || '?'}`;
      case 'completed_journey': return `${data?.userName || 'Someone'} finished "${data?.journeyName || 'a journey'}"`;
      case 'feedback': return `New feedback on "${data?.journeyName || 'a journey'}"`;
      default: return 'Activity recorded';
    }
  };

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

  const isLoading = statsLoading;

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

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Earnings Card */}
            <Card className="bg-background border" data-testid="card-earnings">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <CardTitle className="text-base font-medium">Earnings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold mb-2" data-testid="text-earnings">$0</div>
                <p className="text-sm text-muted-foreground mb-4">Total earnings from all journeys</p>
                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Payment integration coming soon. You'll be able to set prices for your journeys and collect payments automatically.
                </div>
              </CardContent>
            </Card>

            {/* Tips & Guides */}
            <Card className="bg-background border" data-testid="card-tips">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-violet-500" />
                  </div>
                  <CardTitle className="text-base font-medium">Tips for Success</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Start with your expertise</p>
                    <p className="text-xs text-muted-foreground">Upload documents you already have - the AI will transform them</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Focus on one transformation</p>
                    <p className="text-xs text-muted-foreground">Each journey should solve one specific problem</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Make it personal</p>
                    <p className="text-xs text-muted-foreground">Use tasks and reflections to engage participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Recent Activity */}
            <Card className="bg-background border" data-testid="card-recent-activity">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Activity will appear here when participants join your journeys</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="mt-0.5">{getActivityIcon(event.eventType)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{getActivityText(event)}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.createdAt && formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card className="bg-background border" data-testid="card-needs-attention">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-base font-medium">Needs Attention</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {inactiveParticipants.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">All participants are active</p>
                    <p className="text-xs text-muted-foreground mt-1">Inactive participants will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inactiveParticipants.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {p.user?.firstName?.[0] || p.user?.email?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.user?.firstName || p.user?.email || 'Participant'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Day {p.currentDay} of {p.journey?.name || 'journey'}
                          </p>
                          <p className="text-xs text-orange-500">
                            Inactive {p.lastActiveAt && formatDistanceToNow(new Date(p.lastActiveAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="bg-background border" data-testid="card-feedback">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-base font-medium">Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No feedback yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Participant feedback will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

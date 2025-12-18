import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { useQuery } from "@tanstack/react-query";
import { statsApi, activityApi, participantsApi, earningsApi, type DashboardStats, type InactiveParticipant, type EarningsData } from "@/lib/api";
import { Users, CheckCircle, BookOpen, Loader2, TrendingUp, HelpCircle, DollarSign, Lightbulb, Sparkles, Target, MessageCircle, Clock, AlertCircle, UserPlus, Trophy } from "lucide-react";
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

  const { data: earnings } = useQuery<EarningsData>({
    queryKey: ["/api/earnings"],
    queryFn: earningsApi.get,
    enabled: isAuthenticated,
  });

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'joined': return <UserPlus className="h-4 w-4 text-cyan-400" />;
      case 'completed_day': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'completed_journey': return <Trophy className="h-4 w-4 text-amber-400" />;
      case 'feedback': return <MessageCircle className="h-4 w-4 text-fuchsia-400" />;
      default: return <Clock className="h-4 w-4 text-white/40" />;
    }
  };

  const getActivityText = (event: ActivityEvent) => {
    const data = event.eventData as { userName?: string; journeyName?: string; dayNumber?: number } | null;
    switch (event.eventType) {
      case 'joined': return `${data?.userName || 'Someone'} joined "${data?.journeyName || 'a flow'}"`;
      case 'completed_day': return `${data?.userName || 'Someone'} completed day ${data?.dayNumber || '?'}`;
      case 'completed_journey': return `${data?.userName || 'Someone'} finished "${data?.journeyName || 'a flow'}"`;
      case 'feedback': return `New feedback on "${data?.journeyName || 'a flow'}"`;
      default: return 'Activity recorded';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#0f0f23] to-[#0f0f23]">
        <div className="max-w-md text-center p-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Welcome to Flow 83</h1>
          <p className="text-white/60 mb-8">
            Transform your knowledge into powerful 7-day flows that help others grow.
          </p>
          <Button size="lg" asChild data-testid="button-login" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
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

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white" data-testid="text-dashboard-title">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="text-white/50 text-sm mt-1" data-testid="text-welcome-message">
              Here's what's happening with your flows
            </p>
          </div>
          {onboarding.hasSeenOnboarding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onboarding.startOnboarding}
              className="text-white/50 hover:text-white hover:bg-white/10"
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
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all" data-testid="card-total-journeys">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-medium">
                  +0%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1" data-testid="text-total-journeys">{stats?.totalJourneys ?? 0}</div>
              <p className="text-sm text-white/50">Flows</p>
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all" data-testid="card-total-participants">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                  +0%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1" data-testid="text-total-participants">{stats?.totalParticipants ?? 0}</div>
              <p className="text-sm text-white/50">Participants</p>
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all" data-testid="card-active-participants">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  +0%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1" data-testid="text-active-participants">{stats?.activeParticipants ?? 0}</div>
              <p className="text-sm text-white/50">Active Now</p>
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all" data-testid="card-completion-rate">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  {stats?.completionRate ?? 0}%
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1" data-testid="text-completion-rate">{stats?.completionRate ?? 0}%</div>
              <p className="text-sm text-white/50">Completion</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2 bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6" data-testid="card-earnings">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Earnings</h3>
                    <p className="text-xs text-white/40">Total revenue</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  {(earnings?.paymentCount ?? 0) > 0 ? `${earnings?.paymentCount} sales` : 'No sales yet'}
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-2" data-testid="text-earnings">
                ${(earnings?.totalEarnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-white/40 mb-6">Total earnings from all flows</p>
              {(earnings?.recentPayments?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 mb-2">Recent sales</p>
                  {earnings?.recentPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm text-white">{payment.customerName || payment.customerEmail}</p>
                        <p className="text-xs text-white/40">{new Date(payment.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-emerald-400 font-medium">${payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60">
                    Set a price for your flows and start collecting payments. Your earnings will appear here automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6" data-testid="card-tips">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Tips</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Sparkles className="h-4 w-4 text-fuchsia-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Start with your expertise</p>
                    <p className="text-xs text-white/40">Upload your existing documents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Target className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Focus on one transformation</p>
                    <p className="text-xs text-white/40">Solve one specific problem</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <MessageCircle className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Make it personal</p>
                    <p className="text-xs text-white/40">Engage with tasks & reflections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6" data-testid="card-recent-activity">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-white/40">No activity yet</p>
                  <p className="text-xs text-white/30 mt-1">Activity will appear when participants join</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="mt-0.5">{getActivityIcon(event.eventType)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{getActivityText(event)}</p>
                        <p className="text-xs text-white/40">
                          {event.createdAt && formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6" data-testid="card-needs-attention">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
              </div>
              {inactiveParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-white/40">All participants are active</p>
                  <p className="text-xs text-white/30 mt-1">Inactive participants will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inactiveParticipants.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/20 flex items-center justify-center text-xs font-medium text-orange-300">
                        {p.user?.firstName?.[0] || p.user?.email?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.user?.firstName || p.user?.email || 'Participant'}</p>
                        <p className="text-xs text-white/40 truncate">
                          Day {p.currentDay} of {p.journey?.name || 'flow'}
                        </p>
                        <p className="text-xs text-orange-400">
                          Inactive {p.lastActiveAt && formatDistanceToNow(new Date(p.lastActiveAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6" data-testid="card-feedback">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Feedback</h3>
              </div>
              <div className="text-center py-8">
                <p className="text-sm text-white/40">No feedback yet</p>
                <p className="text-xs text-white/30 mt-1">Participant feedback will appear here</p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

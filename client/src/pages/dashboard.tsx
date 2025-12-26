import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { useQuery } from "@tanstack/react-query";
import { statsApi, activityApi, earningsApi, type DashboardStats, type EarningsData } from "@/lib/api";
import { Users, CheckCircle, BookOpen, Loader2, TrendingUp, HelpCircle, DollarSign, Clock, UserPlus, Trophy, MessageCircle, CreditCard, Sparkles, ExternalLink, AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { ActivityEvent } from "@shared/schema";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

type SubscriptionStatus = {
  plan: string | null;
  status: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
};

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

  const { data: earnings } = useQuery<EarningsData>({
    queryKey: ["/api/earnings"],
    queryFn: earningsApi.get,
    enabled: isAuthenticated,
  });

  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const { data: stripeStatus } = useQuery<{ connected: boolean; status?: string; chargesEnabled?: boolean; payoutsEnabled?: boolean }>({
    queryKey: ["/api/stripe/connect/status"],
    queryFn: () => fetch("/api/stripe/connect/status", { credentials: "include" }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  const handleManageSubscription = async () => {
    try {
      const response = await apiRequest("GET", "/api/subscription/portal");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Failed to get billing portal:", error);
    }
  };

  const getSubscriptionDisplay = () => {
    if (!subscription?.plan) {
      return null;
    }

    const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
    const isTrialing = subscription.status === "trialing";
    const isCanceling = subscription.status === "canceling" || subscription.status === "canceled";

    if (isTrialing && subscription.trialEndsAt) {
      const daysLeft = differenceInDays(new Date(subscription.trialEndsAt), new Date());
      return {
        label: `${planName} Trial`,
        sublabel: `${Math.max(0, daysLeft)} days left`,
        variant: "trial" as const,
      };
    }

    if (isCanceling && subscription.subscriptionEndsAt) {
      return {
        label: planName,
        sublabel: `Ends ${new Date(subscription.subscriptionEndsAt).toLocaleDateString()}`,
        variant: "canceling" as const,
      };
    }

    return {
      label: planName,
      sublabel: "Active subscription",
      variant: "active" as const,
    };
  };

  const subscriptionDisplay = getSubscriptionDisplay();

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'joined': return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'completed_day': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'completed_journey': return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'feedback': return <MessageCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-rose-50">
        <div className="max-w-md text-center p-8">
          <h1 className="text-3xl font-bold mb-4 text-slate-900">Welcome to Flow 83</h1>
          <p className="text-slate-600 mb-8">
            Transform your knowledge into powerful 7-day flows that help others grow.
          </p>
          <Button size="lg" asChild data-testid="button-login" className="bg-violet-600 hover:bg-violet-700">
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
            <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-dashboard-title">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="text-slate-500 text-sm mt-1" data-testid="text-welcome-message">
              Here's what's happening with your flows
            </p>
          </div>
          {onboarding.hasSeenOnboarding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onboarding.startOnboarding}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              data-testid="button-start-tutorial"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Tutorial
            </Button>
          )}
        </div>
      </header>

      {!subscription?.plan && (
        <div className="mb-8 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl p-5 flex items-center justify-between" data-testid="banner-no-subscription">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Start your 7-day free trial</h3>
              <p className="text-sm text-slate-600">Get access to all features and start creating flows today.</p>
            </div>
          </div>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 rounded-full" data-testid="button-start-trial">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      )}

      {subscriptionDisplay && (
        <div 
          className={`mb-8 rounded-2xl p-5 flex items-center justify-between ${
            subscriptionDisplay.variant === "trial" 
              ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200" 
              : subscriptionDisplay.variant === "canceling"
              ? "bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200"
              : "bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200"
          }`}
          data-testid="banner-subscription-status"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              subscriptionDisplay.variant === "trial" 
                ? "bg-amber-100" 
                : subscriptionDisplay.variant === "canceling"
                ? "bg-rose-100"
                : "bg-emerald-100"
            }`}>
              <CreditCard className={`h-6 w-6 ${
                subscriptionDisplay.variant === "trial" 
                  ? "text-amber-600" 
                  : subscriptionDisplay.variant === "canceling"
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{subscriptionDisplay.label}</h3>
              <p className={`text-sm ${
                subscriptionDisplay.variant === "trial" 
                  ? "text-amber-700" 
                  : subscriptionDisplay.variant === "canceling"
                  ? "text-rose-700"
                  : "text-emerald-700"
              }`}>{subscriptionDisplay.sublabel}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="rounded-full border-slate-300 hover:border-slate-400"
            onClick={handleManageSubscription}
            data-testid="button-manage-subscription"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        </div>
      )}

      {stripeStatus && !stripeStatus.chargesEnabled && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between" data-testid="banner-stripe-not-connected">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {stripeStatus.connected ? "Complete Your Stripe Setup" : "Connect Payments to Receive Money"}
              </h3>
              <p className="text-sm text-amber-700">
                {stripeStatus.connected 
                  ? "Your Stripe account is linked but setup is incomplete. Complete it to receive payments."
                  : "Connect your Stripe account to receive payments directly from your participants."
                }
              </p>
            </div>
          </div>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white rounded-full" data-testid="button-connect-stripe-dashboard">
            <Link href="/profile">{stripeStatus.connected ? "Complete Setup" : "Connect Stripe"}</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-violet-200 transition-all" data-testid="card-total-journeys">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1" data-testid="text-total-journeys">{stats?.totalJourneys ?? 0}</div>
              <p className="text-sm text-slate-500">Flows</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-sky-200 transition-all" data-testid="card-total-participants">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1" data-testid="text-total-participants">{stats?.totalParticipants ?? 0}</div>
              <p className="text-sm text-slate-500">Participants</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-emerald-200 transition-all" data-testid="card-active-participants">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1" data-testid="text-active-participants">{stats?.activeParticipants ?? 0}</div>
              <p className="text-sm text-slate-500">Active Now</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-amber-200 transition-all" data-testid="card-completion-rate">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1" data-testid="text-completion-rate">{stats?.completionRate ?? 0}%</div>
              <p className="text-sm text-slate-500">Completion</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all" data-testid="card-earnings">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Earnings</h3>
                    <p className="text-xs text-slate-400">Total revenue</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  {(earnings?.paymentCount ?? 0) > 0 ? `${earnings?.paymentCount} sales` : 'No sales yet'}
                </span>
              </div>
              <div className="text-4xl font-bold text-slate-900 mb-2" data-testid="text-earnings">
                ${(earnings?.totalEarnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-slate-400 mb-6">Total earnings from all flows</p>
              {(earnings?.recentPayments?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 mb-2">Recent sales</p>
                  {earnings?.recentPayments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm text-slate-900">{payment.customerName || payment.customerEmail}</p>
                        <p className="text-xs text-slate-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-emerald-600 font-semibold">${payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-600">
                    Set a price for your flows and start collecting payments. Your earnings will appear here automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all" data-testid="card-recent-activity">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">No activity yet</p>
                  <p className="text-xs text-slate-300 mt-1">Activity will appear when participants join</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="mt-0.5">{getActivityIcon(event.eventType)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{getActivityText(event)}</p>
                        <p className="text-xs text-slate-400">
                          {event.createdAt && formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

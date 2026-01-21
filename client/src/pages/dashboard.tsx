import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { TermsAcceptanceModal } from "@/components/TermsAcceptanceModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { statsApi, activityApi, earningsApi, type DashboardStats, type EarningsData } from "@/lib/api";
import { Users, CheckCircle, BookOpen, Loader2, TrendingUp, HelpCircle, DollarSign, Clock, UserPlus, Trophy, MessageCircle, Sparkles, ExternalLink, AlertTriangle, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import type { ActivityEvent } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { t, i18n } = useTranslation('dashboard');
  const { user, isAuthenticated, isLoading: authLoading, isProfileComplete } = useAuth();
  const onboarding = useOnboarding();
  const { plan, planName, planNameHe, commissionRate, monthlyFee, isLoading: planLoading } = useSubscriptionStatus();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isHebrew = i18n.language === 'he';
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const showTermsModal = isAuthenticated && user && !user.termsAcceptedAt && !termsAccepted;

  // Check if user is super_admin and redirect to admin dashboard
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (adminCheck?.isAdmin) {
      navigate("/admin");
    }
  }, [adminCheck?.isAdmin, navigate]);

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
      case 'joined': return t('activityJoined', { name: data?.userName || t('someone'), ns: 'dashboard' });
      case 'completed_day': return t('activityCompleted', { name: data?.userName || t('someone'), day: data?.dayNumber || '?', ns: 'dashboard' });
      case 'completed_journey': return t('activityFinished', { name: data?.userName || t('someone'), ns: 'dashboard' });
      case 'feedback': return t('activityFeedback', { name: data?.journeyName || t('aFlow'), ns: 'dashboard' });
      default: return t('activityRecorded', { ns: 'dashboard' });
    }
  };

  // Format currency based on current language (Hebrew = ILS, English = USD)
  const formatCurrency = useMemo(() => {
    const isHebrew = i18n.language === 'he';
    const currencySymbol = isHebrew ? '₪' : '$';
    const locale = isHebrew ? 'he-IL' : 'en-US';
    
    return (amount: number) => {
      const formatted = amount.toLocaleString(locale, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      return isHebrew ? `${formatted} ${currencySymbol}` : `${currencySymbol}${formatted}`;
    };
  }, [i18n.language]);

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
      <TermsAcceptanceModal 
        open={!!showTermsModal} 
        onAccepted={() => setTermsAccepted(true)} 
      />
      
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

      <header className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900" data-testid="text-dashboard-title">
              {t('welcomeBack', { name: user?.firstName || '', ns: 'auth' })}
            </h1>
            <p className="text-slate-500 text-sm mt-1" data-testid="text-welcome-message">
              {t('hereIsWhatsHappening')}
            </p>
          </div>
          {onboarding.hasSeenOnboarding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onboarding.startOnboarding}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 self-start sm:self-auto h-11 sm:h-9"
              data-testid="button-start-tutorial"
            >
              <HelpCircle className="h-4 w-4 me-2" />
              {t('tutorial')}
            </Button>
          )}
        </div>
      </header>

      {user?.paymentFailedAt && (() => {
        const failedDate = new Date(user.paymentFailedAt);
        const gracePeriodEnds = new Date(failedDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
        const daysLeft = Math.max(0, Math.ceil((gracePeriodEnds.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        const isExpired = daysLeft === 0;
        
        return (
          <div 
            className={`mb-6 md:mb-8 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
              isExpired 
                ? "bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300" 
                : "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300"
            }`}
            data-testid="banner-payment-failed"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex-shrink-0 flex items-center justify-center ${
                isExpired ? "bg-red-100" : "bg-amber-100"
              }`}>
                <AlertTriangle className={`h-5 w-5 md:h-6 md:w-6 ${isExpired ? "text-red-600" : "text-amber-600"}`} />
              </div>
              <div className="min-w-0">
                <h3 className={`font-semibold text-sm md:text-base ${isExpired ? "text-red-900" : "text-amber-900"}`}>
                  {isExpired ? t('flowsBlocked') : t('paymentFailed')}
                </h3>
                <p className={`text-xs md:text-sm ${isExpired ? "text-red-700" : "text-amber-700"}`}>
                  {isExpired 
                    ? t('flowsBlockedDescription')
                    : t('paymentFailedDescription', { days: daysLeft })
                  }
                </p>
              </div>
            </div>
            <Button 
              className={`rounded-full w-full sm:w-auto h-11 sm:h-10 ${
                isExpired 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
              onClick={() => window.open('https://app.lemonsqueezy.com/my-orders', '_blank')}
              data-testid="button-fix-payment"
            >
              {t('updatePayment')}
            </Button>
          </div>
        );
      })()}

      {!isProfileComplete && (
        <div 
          className="mb-6 md:mb-8 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200"
          data-testid="banner-profile-incomplete"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-violet-100 flex-shrink-0 flex items-center justify-center">
              <User className="h-5 w-5 md:h-6 md:w-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm md:text-base text-violet-900">
                {t('profileCompletion.bannerTitle')}
              </h3>
              <p className="text-xs md:text-sm text-violet-700">
                {t('profileCompletion.bannerDescription')}
              </p>
            </div>
          </div>
          <Button 
            className="rounded-full bg-violet-600 hover:bg-violet-700 w-full sm:w-auto h-11 sm:h-10"
            asChild
            data-testid="button-complete-profile"
          >
            <Link href="/profile">{t('profileCompletion.completeNow')}</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-5 hover:shadow-md hover:border-violet-200 transition-all" data-testid="card-total-journeys">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-violet-50 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-0.5 md:mb-1" data-testid="text-total-journeys">{stats?.totalJourneys ?? 0}</div>
              <p className="text-xs md:text-sm text-slate-500">{t('myFlows')}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-5 hover:shadow-md hover:border-sky-200 transition-all" data-testid="card-total-participants">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-sky-50 flex items-center justify-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-sky-600" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-0.5 md:mb-1" data-testid="text-total-participants">{stats?.totalParticipants ?? 0}</div>
              <p className="text-xs md:text-sm text-slate-500">{t('participants')}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-5 hover:shadow-md hover:border-emerald-200 transition-all" data-testid="card-active-participants">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-0.5 md:mb-1" data-testid="text-active-participants">{stats?.activeParticipants ?? 0}</div>
              <p className="text-xs md:text-sm text-slate-500">{t('activeParticipants')}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3 md:p-5 hover:shadow-md hover:border-amber-200 transition-all" data-testid="card-completion-rate">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-0.5 md:mb-1" data-testid="text-completion-rate">{stats?.completionRate ?? 0}%</div>
              <p className="text-xs md:text-sm text-slate-500">{t('completedParticipants')}</p>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all" data-testid="card-earnings">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900">{t('earnings')}</h3>
                    <p className="text-xs text-slate-400">{t('totalRevenue')}</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-medium self-start sm:self-auto">
                  {(earnings?.paymentCount ?? 0) > 0 ? t('salesCount', { count: earnings?.paymentCount }) : t('noSalesYet')}
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-3" data-testid="text-earnings">
                {formatCurrency(earnings?.totalEarnings ?? 0)}
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isHebrew ? 'סה"כ גולמי' : 'Gross Revenue'}</span>
                  <span className="text-slate-700">{formatCurrency(earnings?.grossEarnings ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isHebrew ? `עמלה (${Math.round((earnings?.commissionRate ?? 0.17) * 100)}%)` : `Commission (${Math.round((earnings?.commissionRate ?? 0.17) * 100)}%)`}</span>
                  <span className="text-rose-500">-{formatCurrency(earnings?.commissionFees ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-1 border-t border-slate-100">
                  <span className="text-slate-700">{isHebrew ? 'נטו לתשלום' : 'Net Payout'}</span>
                  <span className="text-emerald-600">{formatCurrency(earnings?.totalEarnings ?? 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md hover:border-violet-200 transition-all" data-testid="card-subscription">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-violet-50 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900">{isHebrew ? 'המסלול שלי' : 'My Plan'}</h3>
                    <p className="text-xs text-slate-400">{isHebrew ? 'תשלום ועמלות' : 'Billing & Fees'}</p>
                  </div>
                </div>
                <Link href="/pricing" className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-600 font-medium hover:bg-violet-100 transition-colors self-start sm:self-auto">
                  {isHebrew ? 'שנה מסלול' : 'Change Plan'}
                </Link>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl md:text-4xl font-bold text-slate-900" data-testid="text-plan-name">
                  {isHebrew ? planNameHe : planName}
                </span>
                {monthlyFee > 0 && (
                  <span className="text-sm text-slate-500">
                    ₪{monthlyFee}/{isHebrew ? 'חודש' : 'mo'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  {Math.round(commissionRate * 100)}% {isHebrew ? 'עמלה' : 'commission'}
                </span>
                {plan === 'free' && (
                  <span className="text-xs text-slate-400">
                    {isHebrew ? 'ללא תשלום חודשי' : 'No monthly fee'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 mt-4 md:mt-6">
            <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all" data-testid="card-recent-activity">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-violet-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">{t('recentActivity')}</h3>
              </div>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">{t('noActivity')}</p>
                  <p className="text-xs text-slate-300 mt-1">{t('activityWillAppear')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, isMobile ? 3 : 5).map((event) => (
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
                  {isMobile && recentActivity.length > 3 && (
                    <p className="text-center text-xs text-slate-400 pt-2">
                      {t('andMoreActivities', { count: recentActivity.length - 3 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </DashboardLayout>
  );
}

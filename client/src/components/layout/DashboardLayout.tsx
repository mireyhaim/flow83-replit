import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Menu, X, MessageCircle, Crown, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const { t, i18n } = useTranslation(['dashboard', 'common', 'participant']);
  const { isTrialExpired, isOnTrial, daysRemaining, isLoading: trialLoading } = useTrialStatus();
  const isHebrew = i18n.language === 'he';

  useEffect(() => {
    if (isTrialExpired) {
      setShowExpiredModal(true);
    }
  }, [isTrialExpired]);

  const getTrialBannerText = () => {
    if (daysRemaining === 0) return t('dashboard:trialBanner.lastDay');
    if (daysRemaining === 1) return t('dashboard:trialBanner.oneDayRemaining');
    return t('dashboard:trialBanner.daysRemaining', { days: daysRemaining });
  };

  const handleSubscribe = () => {
    // Hebrew users go to Grow, English users go to LemonSqueezy
    const baseUrl = isHebrew 
      ? 'https://pay.grow.link/345b96922ae5b62bf5b91c8a4828a3bc-MjkyNzAzNQ'
      : 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
    window.open(`${baseUrl}${baseUrl.includes('?') ? '&' : '?'}checkout[redirect_url]=${returnUrl}`, '_blank');
  };

  const navItems = [
    { icon: LayoutGrid, label: t('dashboard:title'), href: "/dashboard" },
    { icon: PenTool, label: t('dashboard:myFlows'), href: "/journeys" },
    { icon: MessageCircle, label: t('participant:feedback'), href: "/feedback" },
    { icon: User, label: t('common:profile'), href: "/profile" },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-600 hover:text-violet-700 transition-colors">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-600"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-violet-50 text-violet-700 border border-indigo-100" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-violet-600" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
        {isOnTrial && !trialLoading && (
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-200/50 mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Crown size={16} className="text-violet-500" />
              <span className="text-violet-700 font-medium">{getTrialBannerText()}</span>
            </div>
            <button
              onClick={handleSubscribe}
              className="mt-2 text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2"
              data-testid="link-subscribe-sidebar"
            >
              {t('dashboard:trialBanner.subscribeNow')}
            </button>
          </div>
        )}
        {isTrialExpired && !trialLoading && (
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200/50 mb-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-orange-500" />
              <span className="text-orange-700 font-medium">{t('dashboard:trialExpired.title')}</span>
            </div>
            <button
              onClick={handleSubscribe}
              className="mt-2 text-xs text-orange-600 hover:text-orange-800 underline underline-offset-2"
              data-testid="link-subscribe-expired-sidebar"
            >
              {t('dashboard:trialExpired.subscribeNow')}
            </button>
          </div>
        )}
        <Link 
          href="/journeys/new"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-all w-full justify-center shadow-sm"
        >
          <Plus size={18} />
          {t('dashboard:createFlow')}
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 w-full transition-colors"
              data-testid="button-sign-out"
            >
              <LogOut size={18} />
              {t('common:logout')}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard:confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard:confirmDelete')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  window.location.href = "/api/logout";
                }}
              >
                {t('common:logout')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-violet-600">
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-700"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "md:hidden fixed top-0 start-0 h-full w-72 bg-white z-40 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl",
        mobileMenuOpen ? "translate-x-0 rtl:-translate-x-0" : "-translate-x-full rtl:translate-x-full"
      )}>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-e border-slate-200 flex-col fixed h-full z-10 start-0">
        <NavContent />
      </aside>

      <main className="flex-1 md:ms-60 min-h-screen bg-slate-50 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
          {children}
        </div>
      </main>

      <TrialExpiredModal 
        isOpen={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)} 
      />
    </div>
  );
}

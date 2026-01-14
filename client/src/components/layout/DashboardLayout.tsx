import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Menu, X, MessageCircle, Crown, AlertCircle, BookOpen, Wallet } from "lucide-react";
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
}

export function DashboardLayout({ children, variant = "light" }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const { t, i18n } = useTranslation(['dashboard', 'common', 'participant']);
  const { isTrialExpired, isOnTrial, daysRemaining, isLoading: trialLoading } = useTrialStatus();
  const isHebrew = i18n.language === 'he';
  const isDark = variant === "dark";

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
    const baseUrl = isHebrew 
      ? 'https://pay.grow.link/345b96922ae5b62bf5b91c8a4828a3bc-MjkyNzAzNQ'
      : 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
    window.open(`${baseUrl}${baseUrl.includes('?') ? '&' : '?'}checkout[redirect_url]=${returnUrl}`, '_blank');
  };

  const navItems = [
    { icon: LayoutGrid, label: t('dashboard:title'), href: "/dashboard" },
    { icon: BookOpen, label: t('dashboard:myFlows'), href: "/journeys" },
    { icon: Wallet, label: t('dashboard:payments'), href: "/payments" },
    { icon: MessageCircle, label: t('participant:feedback'), href: "/feedback" },
    { icon: User, label: t('common:profile'), href: "/profile" },
  ];

  const styles = {
    light: {
      wrapper: "min-h-screen bg-slate-50 text-slate-900 flex font-sans",
      sidebar: "bg-white border-e border-slate-200",
      mobileSidebar: "bg-white shadow-xl",
      mobileHeader: "bg-white border-b border-slate-200",
      logo: "text-violet-600 hover:text-violet-700",
      closeBtn: "text-slate-400 hover:text-slate-600",
      menuBtn: "text-slate-500 hover:text-slate-700",
      navActive: "bg-violet-50 text-violet-700 border border-indigo-100",
      navInactive: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      navIcon: "text-violet-600",
      trialBanner: "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-200/50",
      trialText: "text-violet-700",
      trialLink: "text-violet-600 hover:text-violet-800",
      expiredBanner: "bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200/50",
      expiredText: "text-orange-700",
      expiredLink: "text-orange-600 hover:text-orange-800",
      createBtn: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm",
      logoutBtn: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      overlay: "bg-slate-900/20 backdrop-blur-sm",
      main: "bg-slate-50",
      dialogBg: "",
      dialogTitle: "",
      dialogDesc: "",
      dialogCancel: "",
    },
    dark: {
      wrapper: "min-h-screen text-white flex font-sans relative overflow-hidden",
      sidebar: "bg-black/20 backdrop-blur-xl border-e border-white/5",
      mobileSidebar: "bg-[#0f0a1f] border-e border-white/5",
      mobileHeader: "bg-[#0f0a1f]/90 backdrop-blur-xl border-b border-white/5",
      logo: "bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent",
      closeBtn: "text-white/40 hover:text-white",
      menuBtn: "text-white/60 hover:text-white",
      navActive: "bg-violet-600/20 text-violet-300 border border-violet-500/30",
      navInactive: "text-white/60 hover:bg-white/5 hover:text-white",
      navIcon: "text-violet-400",
      trialBanner: "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30",
      trialText: "text-violet-300",
      trialLink: "text-violet-400 hover:text-violet-300",
      expiredBanner: "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30",
      expiredText: "text-orange-300",
      expiredLink: "text-orange-400 hover:text-orange-300",
      createBtn: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 shadow-lg shadow-violet-600/25",
      logoutBtn: "text-white/40 hover:bg-white/5 hover:text-white/60",
      overlay: "bg-black/50 backdrop-blur-sm",
      main: "bg-transparent",
      dialogBg: "bg-[#1a1a2e] border-white/10",
      dialogTitle: "text-white",
      dialogDesc: "text-white/60",
      dialogCancel: "bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white",
    }
  };

  const s = styles[variant];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className={cn("text-xl font-bold transition-colors", s.logo)}>
          Flow 83
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className={cn("md:hidden p-2", s.closeBtn)}
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
                isActive ? s.navActive : s.navInactive
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? s.navIcon : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
        {isOnTrial && !trialLoading && (
          <div className={cn("px-4 py-3 rounded-xl mb-2", s.trialBanner)}>
            <div className="flex items-center gap-2 text-sm">
              <Crown size={16} className={isDark ? "text-violet-400" : "text-violet-500"} />
              <span className={cn("font-medium", s.trialText)}>{getTrialBannerText()}</span>
            </div>
            <button
              onClick={handleSubscribe}
              className={cn("mt-2 text-xs underline underline-offset-2", s.trialLink)}
              data-testid="link-subscribe-sidebar"
            >
              {t('dashboard:trialBanner.subscribeNow')}
            </button>
          </div>
        )}
        {isTrialExpired && !trialLoading && (
          <div className={cn("px-4 py-3 rounded-xl mb-2", s.expiredBanner)}>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={16} className={isDark ? "text-orange-400" : "text-orange-500"} />
              <span className={cn("font-medium", s.expiredText)}>{t('dashboard:trialExpired.title')}</span>
            </div>
            <button
              onClick={handleSubscribe}
              className={cn("mt-2 text-xs underline underline-offset-2", s.expiredLink)}
              data-testid="link-subscribe-expired-sidebar"
            >
              {t('dashboard:trialExpired.subscribeNow')}
            </button>
          </div>
        )}
        <Link 
          href="/journeys/new"
          onClick={() => setMobileMenuOpen(false)}
          className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full justify-center", s.createBtn)}
        >
          <Plus size={18} />
          {t('dashboard:createFlow')}
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-colors", s.logoutBtn)}
              data-testid="button-sign-out"
            >
              <LogOut size={18} />
              {t('common:logout')}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className={isDark ? "bg-[#1a1a2e] border-white/10" : ""}>
            <AlertDialogHeader>
              <AlertDialogTitle className={isDark ? "text-white" : ""}>{t('common:logoutConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription className={isDark ? "text-white/60" : ""}>
                {t('common:logoutConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={isDark ? "bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white" : ""}>{t('common:cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  window.location.href = "/api/logout";
                }}
                className={isDark ? "bg-violet-600 hover:bg-violet-700" : ""}
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
    <div className={cn(s.wrapper, isDark && "bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f]")}>
      {isDark && (
        <>
          <div className="absolute top-1/4 start-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 end-1/3 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}
      
      <div className={cn("relative z-10 flex w-full", isDark && "")}>
        {/* Mobile Header - hamburger first for RTL (appears on right in RTL mode) */}
        <div className={cn("md:hidden fixed top-0 inset-x-0 z-20 px-4 py-3 flex items-center justify-between", s.mobileHeader)}>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className={cn("p-2 order-last rtl:order-first", s.menuBtn)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className={cn("text-lg font-bold order-first rtl:order-last", s.logo)}>
            Flow 83
          </Link>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className={cn("md:hidden fixed inset-0 z-30", s.overlay)}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={cn(
          "md:hidden fixed top-0 start-0 h-full w-72 z-40 flex flex-col transform transition-transform duration-300 ease-in-out",
          s.mobileSidebar,
          mobileMenuOpen ? "translate-x-0 rtl:-translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}>
          <NavContent />
        </aside>

        {/* Desktop Sidebar */}
        <aside className={cn("hidden md:flex w-60 flex-col fixed h-full z-10 start-0", s.sidebar)}>
          <NavContent />
        </aside>

        <main className={cn("flex-1 md:ms-60 min-h-screen pt-16 md:pt-0", s.main)}>
          <div className="max-w-6xl mx-auto px-3 py-4 md:p-8 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      <TrialExpiredModal 
        isOpen={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)} 
      />
    </div>
  );
}

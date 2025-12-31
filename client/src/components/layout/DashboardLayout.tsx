import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenTool, LogOut, Plus, User, Menu, X, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/language-toggle";
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
  const { t } = useTranslation(['dashboard', 'common', 'participant']);

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
        <div className="px-4 py-2">
          <LanguageToggle />
        </div>
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
    </div>
  );
}

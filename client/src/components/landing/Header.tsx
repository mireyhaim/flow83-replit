import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation(['landing', 'common', 'dashboard']);
  const getStartLink = () => isAuthenticated ? "/dashboard" : "/start-flow";

  return (
    <header className="w-full px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-violet-600 cursor-pointer hover:text-violet-500 transition-colors">
          Flow 83
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            {t('common:home')}
          </Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            {t('howItWorks')}
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            {t('pricing')}
          </Link>
          <Link href="/community" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            {t('community')}
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
            {t('contact')}
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <a href="/api/logout">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100" data-testid="button-header-sign-out">{t('common:logout')}</Button>
              </a>
              <Link href="/dashboard">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 rounded-full" data-testid="button-header-my-flow">
                  {t('dashboard:title')}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <a href="/api/login?returnTo=/dashboard">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100" data-testid="button-header-login">{t('common:login')}</Button>
              </a>
              <Link href={getStartLink()}>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 rounded-full" data-testid="button-header-get-started">
                  {t('getStarted')}
                </Button>
              </Link>
            </>
          )}
        </div>

        <button 
          className="md:hidden text-gray-600 hover:text-gray-900 order-last rtl:order-first"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 space-y-4">
          <Link href="/" className="block text-gray-600 hover:text-gray-900 py-2">{t('common:home')}</Link>
          <Link href="/how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">{t('howItWorks')}</Link>
          <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 py-2">{t('pricing')}</Link>
          <Link href="/community" className="block text-gray-600 hover:text-gray-900 py-2">{t('community')}</Link>
          <Link href="/contact" className="block text-gray-600 hover:text-gray-900 py-2">{t('contact')}</Link>
          <div className="pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 rounded-full">{t('dashboard:title')}</Button>
                </Link>
                <a href="/api/logout" className="block">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full">{t('common:logout')}</Button>
                </a>
              </>
            ) : (
              <>
                <a href="/api/login?returnTo=/dashboard">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">{t('common:login')}</Button>
                </a>
                <Link href={getStartLink()}>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 rounded-full">{t('getStarted')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

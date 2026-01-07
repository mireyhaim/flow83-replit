import { Link, useLocation } from "wouter";
import ConversationalJourneyWizard from "@/components/journey/ConversationalJourneyWizard";
import { LayoutGrid, Globe, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const JourneyCreatePage = () => {
  const { t, i18n } = useTranslation('dashboard');
  const { isProfileComplete } = useAuth();
  const [, navigate] = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
  };

  return (
    <div className="min-h-screen bg-[#0f0a1f]">
      <Dialog open={!isProfileComplete}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
              <User className="h-8 w-8 text-violet-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              {t('profileCompletion.gateTitle')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('profileCompletion.gateDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => navigate('/profile')}
              data-testid="button-gate-complete-profile"
            >
              {t('profileCompletion.gateButton')}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/journeys')}
              data-testid="button-gate-back"
            >
              {t('journeySettings.backToEditor')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="fixed top-0 left-0 right-0 bg-[#0f0a1f]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/journeys" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-my-flows">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">{t('journeyCreate.myFlows')}</span>
              </Link>
              <div className="h-4 w-px bg-white/10 mx-4" />
              <h1 className="text-sm font-medium text-white">{t('journeyCreate.createNewFlow')}</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-white/60 hover:text-white hover:bg-white/10 h-8"
              data-testid="button-toggle-language"
            >
              <Globe className="w-4 h-4 me-2" />
              {i18n.language === 'he' ? 'EN' : 'עב'}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <ConversationalJourneyWizard />
      </main>
    </div>
  );
};

export default JourneyCreatePage;

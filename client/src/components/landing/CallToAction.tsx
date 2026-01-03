import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

const CallToAction = () => {
  const { t } = useTranslation('landing');
  const { isAuthenticated } = useAuth();
  const getStartLink = () => isAuthenticated ? "/dashboard" : "/start-flow";

  return (
    <section className="py-32 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm text-white/90">{t('joinThousandsGuides')}</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
            <span className="text-white">{t('readyToShare')} </span>
            <span className="text-white/90">
              {t('yourGift')}
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('ctaDescription')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={getStartLink()}>
              <Button 
                size="lg"
                className="text-lg px-8 py-4 h-auto rounded-full bg-white text-violet-700 hover:bg-gray-100 shadow-lg"
                data-testid="button-cta-get-started"
              >
                {t('turnMethodIntoFlow')}
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
              <span className="text-sm">{t('freeToStart')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="text-sm">{t('noTechSkills')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-fuchsia-300" />
              <span className="text-sm">{t('builtInMonetization')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;

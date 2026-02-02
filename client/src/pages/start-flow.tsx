import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Sparkles, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import loginImage from "@assets/ChatGPT_Image_Dec_26,_2025,_07_05_52_PM_1766771570678.png";

export default function StartFlowPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    // After successful authentication, redirect to dashboard
    setLocation("/dashboard");
  }, [authLoading, isAuthenticated, setLocation]);

  const handleLogin = () => {
    window.location.href = "/login?returnTo=/dashboard";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-violet-600 animate-pulse" />
          </div>
          <Loader2 className="w-8 h-8 mx-auto text-violet-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <Link href="/">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent cursor-pointer inline-block">
                  Flow 83
                </h1>
              </Link>
              <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                {t('startBuilding')}
              </h2>
              <p className="mt-2 text-gray-600">
                {t('signInToCreate')}
              </p>
            </div>

            <div className="space-y-6">
              <Button
                onClick={handleLogin}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium text-lg"
                data-testid="button-start-free"
              >
                {t('getStarted')}
              </Button>

              <p className="text-center text-sm text-gray-500">
                {t('signInToStart')}
              </p>

              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('aiPoweredJourneys')}</p>
                      <p className="text-sm text-gray-500">{t('aiPoweredJourneysDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('scaleYourPractice')}</p>
                      <p className="text-sm text-gray-500">{t('scaleYourPracticeDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('yourMethodYourWay')}</p>
                      <p className="text-sm text-gray-500">{t('yourMethodDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-violet-600" data-testid="link-back-home">
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-600 items-center justify-center overflow-hidden">
          <img
            src={loginImage}
            alt="Flow 83"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return null;
}

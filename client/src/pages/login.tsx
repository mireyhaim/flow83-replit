import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Users, Shield, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import loginImage from "@/assets/login-hero.png";

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginWithGoogle, loginWithEmailPassword, registerWithEmailPassword, isLoading } = useFirebaseAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/dashboard";

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setLocation(returnTo);
    } catch (error: any) {
      toast({
        title: t('authError'),
        description: t('googleAuthError'),
        variant: "destructive"
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    
    if (password.length < 6) {
      toast({
        title: t('authError'),
        description: t('passwordTooShort'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await registerWithEmailPassword(email, password);
      } else {
        await loginWithEmailPassword(email, password);
      }
      setLocation(returnTo);
    } catch (error: any) {
      let errorMessage = t('authError');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('emailInUse');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('weakPassword');
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = t('userNotFound');
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('wrongPassword');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('invalidEmail');
      }
      toast({
        title: t('authError'),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right side - Form (RTL: appears first) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent cursor-pointer inline-block">
                Flow 83
              </h1>
            </Link>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              {isSignUp ? t('signUpTitle') : t('welcomeToFlow83')}
            </h2>
            <p className="mt-2 text-gray-600">
              {isSignUp ? t('signUpSubtitle') : t('signInToContinue')}
            </p>
          </div>

          <div className="space-y-6">
            {/* Google Sign-in Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isProcessing}
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 font-medium text-lg border border-gray-300 shadow-sm"
              data-testid="button-google-login"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {t('continueWithGoogle')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('orSignInWithEmail')}</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-right"
                  dir="ltr"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-right"
                  dir="ltr"
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                disabled={isProcessing || !email || !password}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium text-lg"
                data-testid="button-email-submit"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isSignUp ? t('createAccount') : t('signIn')
                )}
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                data-testid="button-toggle-signup"
              >
                {isSignUp ? (
                  <>{t('alreadyHaveAccount')} <span className="underline">{t('signIn')}</span></>
                ) : (
                  <>{t('dontHaveAccount')} <span className="underline">{t('signUp')}</span></>
                )}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('securePrivate')}</p>
                    <p className="text-sm text-gray-500">{t('securePrivateDesc')}</p>
                  </div>
                </div>
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
                    <p className="font-medium text-gray-900">{t('joinThousandsMentors')}</p>
                    <p className="text-sm text-gray-500">{t('joinThousandsMentorsDesc')}</p>
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

      {/* Left side - Image (RTL: appears second) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={loginImage}
          alt={t('loginImageAlt')}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

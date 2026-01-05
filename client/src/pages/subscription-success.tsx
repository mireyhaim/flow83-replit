import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionSuccess() {
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const isHebrew = i18n.language === 'he';
  
  const isActive = user?.subscriptionStatus === 'active';
  
  useEffect(() => {
    if (isActive) {
      setChecking(false);
      return;
    }
    
    const checkStatus = async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setRetryCount(prev => prev + 1);
    };
    
    if (retryCount < 10) {
      const timer = setTimeout(checkStatus, 2000);
      return () => clearTimeout(timer);
    } else {
      setChecking(false);
    }
  }, [retryCount, isActive, queryClient]);
  
  const handleManualCheck = async () => {
    setChecking(true);
    setRetryCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        {checking ? (
          <>
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {isHebrew ? "מאמת את התשלום..." : "Verifying payment..."}
            </h1>
            <p className="text-slate-600 mb-6">
              {isHebrew 
                ? "אנחנו בודקים את סטטוס התשלום שלך. זה יכול לקחת כמה שניות." 
                : "We're checking your payment status. This may take a few seconds."}
            </p>
          </>
        ) : isActive ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {isHebrew ? "התשלום אושר!" : "Payment Confirmed!"}
            </h1>
            <p className="text-slate-600 mb-6">
              {isHebrew 
                ? `המינוי שלך לתוכנית ${user?.subscriptionPlan || 'Starter'} פעיל. תודה!`
                : `Your ${user?.subscriptionPlan || 'Starter'} subscription is now active. Thank you!`}
            </p>
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full bg-violet-600 hover:bg-violet-700 rounded-full"
              data-testid="button-go-to-dashboard"
            >
              {isHebrew ? "לדשבורד" : "Go to Dashboard"}
              <ArrowLeft className={`h-4 w-4 ${isHebrew ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {isHebrew ? "עדיין ממתינים לאישור" : "Still waiting for confirmation"}
            </h1>
            <p className="text-slate-600 mb-6">
              {isHebrew 
                ? "אם שילמת בהצלחה, העדכון יגיע תוך דקות ספורות. אם הבעיה נמשכת, פנה לתמיכה."
                : "If you completed payment, the update should arrive within a few minutes. Contact support if this persists."}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleManualCheck}
                className="w-full bg-violet-600 hover:bg-violet-700 rounded-full"
                data-testid="button-check-again"
              >
                {isHebrew ? "בדוק שוב" : "Check Again"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="w-full rounded-full"
                data-testid="button-back-to-dashboard"
              >
                {isHebrew ? "חזרה לדשבורד" : "Back to Dashboard"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

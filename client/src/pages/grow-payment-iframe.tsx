import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowLeft, RefreshCw, ExternalLink, CreditCard } from "lucide-react";

export default function GrowPaymentIframePage() {
  const [, navigate] = useLocation();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentOpened, setPaymentOpened] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("paymentUrl");
    const tkn = params.get("token");
    const ret = params.get("returnUrl");
    
    if (url) setPaymentUrl(decodeURIComponent(url));
    if (tkn) setToken(tkn);
    if (ret) setReturnUrl(decodeURIComponent(ret));
    
    setIsLoading(false);
  }, []);

  const openPaymentWindow = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      setPaymentOpened(true);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optional: validate event.origin for known Grow domains
      const validOrigins = ['pay.grow.link', 'grow.website', 'meshulam.co.il', 'grow.business'];
      const isValidOrigin = validOrigins.some(domain => 
        event.origin.includes(domain)
      );
      
      // Only process messages that look like payment completions
      if (event.data?.type === 'grow_payment_complete' || 
          event.data?.type === 'meshulam_payment_complete' ||
          event.data?.status === 'success') {
        handlePaymentComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token]);

  const handlePaymentComplete = async () => {
    if (!token || isVerifying) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const res = await fetch(`/api/payment/external-verify/${token}`);
      const data = await res.json();
      
      if (data.success && data.accessToken) {
        // Only navigate on successful verification
        navigate(`/p/${data.accessToken}`);
      } else {
        // Verification failed - show error and allow retry
        setVerificationError(data.error || "לא הצלחנו לאמת את התשלום. נסה שוב.");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError("שגיאה באימות התשלום. נסה שוב.");
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!paymentUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">שגיאה</h1>
          <p className="text-gray-600 mb-6">לא נמצא לינק תשלום</p>
          <Button onClick={() => navigate("/")} variant="outline">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  // Only show verifying state when actively verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-600 text-lg">מאמת את התשלום...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col" dir="rtl">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.history.back()}
          className="text-gray-600"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <h1 className="text-lg font-semibold text-gray-800">השלמת תשלום</h1>
        <div className="w-20"></div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-purple-600" />
          </div>
          
          {!paymentOpened ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">המשך לתשלום</h2>
              <p className="text-gray-600 mb-8">
                לחץ על הכפתור למטה כדי לעבור לעמוד התשלום המאובטח
              </p>
              <Button 
                onClick={openPaymentWindow}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
                data-testid="button-open-payment"
              >
                <ExternalLink className="w-5 h-5 ml-2" />
                עבור לתשלום
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">התשלום נפתח בחלון חדש</h2>
              <p className="text-gray-600 mb-4">
                השלם את התשלום בחלון שנפתח, ואז חזור לכאן ולחץ על הכפתור
              </p>
              
              {verificationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{verificationError}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={handlePaymentComplete}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                  disabled={isVerifying}
                  data-testid="button-payment-complete"
                >
                  {verificationError ? (
                    <>
                      <RefreshCw className="w-5 h-5 ml-2" />
                      נסה שוב
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 ml-2" />
                      שילמתי - התחל את המסע
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={openPaymentWindow}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  data-testid="button-reopen-payment"
                >
                  <ExternalLink className="w-5 h-5 ml-2" />
                  פתח שוב את עמוד התשלום
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Loader2, CreditCard } from "lucide-react";

export default function ExternalPaymentPendingPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    const url = params.get("paymentUrl");
    if (url) {
      setPaymentUrl(decodeURIComponent(url));
    }
  }, []);

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
      setPaymentOpened(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!token) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/payment/external-verify/${token}`);
      const data = await res.json();
      
      if (data.success && data.accessToken) {
        navigate(`/p/${data.accessToken}`);
      } else {
        navigate(`/payment/external-success?token=${token}`);
      }
    } catch (error) {
      navigate(`/payment/external-success?token=${token}`);
    }
  };

  if (!token || !paymentUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">שגיאה בתהליך התשלום</h1>
          <p className="text-gray-600 mb-6">
            לא נמצאו פרטי התשלום. נא לחזור ולנסות שוב.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="text-center max-w-md relative bg-white rounded-2xl p-8 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          השלמת התשלום
        </h1>
        
        <div className="space-y-6">
          <div className="text-right bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${paymentOpened ? 'bg-green-500' : 'bg-purple-500'}`}>
                {paymentOpened ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">פתח את עמוד התשלום</h3>
                <p className="text-sm text-gray-600">לחץ על הכפתור למטה לפתיחת עמוד התשלום</p>
              </div>
            </div>
            
            <Button 
              onClick={handleOpenPayment}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
              data-testid="button-open-payment"
            >
              <ExternalLink className="w-5 h-5 ml-2" />
              פתח עמוד תשלום
            </Button>
          </div>

          <div className="text-right bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">השלם את התשלום</h3>
                <p className="text-sm text-gray-600">בצע את התשלום בחלון החדש שנפתח</p>
              </div>
            </div>
          </div>

          <div className="text-right bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">אישור והתחלה</h3>
                <p className="text-sm text-gray-600">לאחר התשלום, לחץ כאן להתחלת המסע</p>
              </div>
            </div>
            
            <Button 
              onClick={handleConfirmPayment}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
              disabled={isVerifying}
              data-testid="button-confirm-payment"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מאמת...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 ml-2" />
                  שילמתי - התחל את המסע
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          התשלום מתבצע דרך ספק התשלומים של המנטור
        </p>
      </div>
    </div>
  );
}

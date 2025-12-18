import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
    setConnectedAccount(params.get("connected_account"));
  }, []);

  const { data: verification, isLoading, error } = useQuery({
    queryKey: ["/api/payment/verify", sessionId, connectedAccount],
    queryFn: () => {
      let url = `/api/payment/verify/${sessionId}`;
      if (connectedAccount) {
        url += `?connected_account=${connectedAccount}`;
      }
      return fetch(url).then(res => res.json());
    },
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 1000,
  });

  const handleStartJourney = () => {
    if (verification?.accessToken) {
      navigate(`/p/${verification.accessToken}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-purple-600">מאמת את התשלום...</p>
        </div>
      </div>
    );
  }

  if (error || !verification?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">משהו השתבש</h1>
          <p className="text-gray-600 mb-6">
            לא הצלחנו לאמת את התשלום. אנא נסי שוב או פני לתמיכה.
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

      <div className="text-center max-w-md relative">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 rounded-full p-2 shadow-lg animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
          התשלום התקבל בהצלחה!
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          ברוכה הבאה למסע! הכל מוכן ומחכה לך.
          <br />
          בואי נתחיל את המסע יחד.
        </p>

        <Button 
          size="lg" 
          className="text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full"
          onClick={handleStartJourney}
          data-testid="button-start-journey"
        >
          התחילי את המסע שלי
          <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
        </Button>

        <div className="mt-8 text-sm text-gray-500">
          <p>אישור נשלח לכתובת האימייל שלך</p>
        </div>
      </div>
    </div>
  );
}

import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Sparkles, Crown, Rocket } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ActivationInfo {
  valid?: boolean;
  alreadyActivated?: boolean;
  expired?: boolean;
  pendingPlan?: string;
  planName?: string;
  plan?: string;
  email?: string;
  firstName?: string;
  error?: string;
}

interface ActivationResult {
  success: boolean;
  plan: string;
  userId: string;
  email: string;
  firstName: string;
}

export default function SubscriptionActivate() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activationComplete, setActivationComplete] = useState(false);

  const { data: activationInfo, isLoading: isLoadingInfo, error: infoError } = useQuery<ActivationInfo>({
    queryKey: ["/api/subscription/activate", token],
    queryFn: async () => {
      const res = await fetch(`/api/subscription/activate/${token}`);
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const activateMutation = useMutation<ActivationResult>({
    mutationFn: async () => {
      const res = await fetch(`/api/subscription/activate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Activation failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setActivationComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const handleActivate = () => {
    activateMutation.mutate();
  };

  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };

  const getPlanIcon = (plan: string) => {
    if (plan === "business" || plan === "Scale") {
      return <Crown className="h-12 w-12 text-amber-400" />;
    }
    return <Rocket className="h-12 w-12 text-violet-400" />;
  };

  const getPlanColor = (plan: string) => {
    if (plan === "business" || plan === "Scale") {
      return "from-amber-500 to-orange-500";
    }
    return "from-violet-500 to-purple-500";
  };

  if (isLoadingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg">בודקים את הקישור...</p>
        </div>
      </div>
    );
  }

  if (infoError || activationInfo?.error) {
    const errorMessage = activationInfo?.error || "הקישור אינו תקף";
    const isExpired = activationInfo?.expired;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-red-500/30 p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-3">
              {isExpired ? "פג תוקף הקישור" : "קישור לא תקף"}
            </h1>
            <p className="text-slate-400 mb-6">
              {isExpired 
                ? "קישור ההפעלה פג תוקף. אנא צרו קשר איתנו לקבלת קישור חדש."
                : errorMessage
              }
            </p>
            <Button
              onClick={() => setLocation("/pricing")}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8"
              data-testid="button-go-pricing"
            >
              לעמוד התמחור
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activationInfo?.alreadyActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-green-500/30 p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-3">
              המנוי כבר פעיל!
            </h1>
            <p className="text-slate-400 mb-6">
              {activationInfo.firstName && `שלום ${activationInfo.firstName}! `}
              המנוי שלך כבר הופעל. אתם יכולים להיכנס לדשבורד.
            </p>
            <Button
              onClick={handleGoToDashboard}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8"
              data-testid="button-go-dashboard"
            >
              לדשבורד →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-green-500/30 p-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-green-500/20 rounded-full animate-ping" />
              </div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="mb-2">
              <Sparkles className="h-6 w-6 text-amber-400 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-3">
              ברוכים הבאים!
            </h1>
            <p className="text-slate-300 text-lg mb-2">
              המנוי הופעל בהצלחה
            </p>
            <p className="text-slate-400 mb-8">
              {activateMutation.data?.firstName && `${activateMutation.data.firstName}, `}
              אתם מוכנים ליצור Flows מדהימים!
            </p>
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-12 py-6 text-lg"
              data-testid="button-go-dashboard-success"
            >
              להתחיל ליצור →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const planName = activationInfo?.planName || "Pro";
  const pendingPlan = activationInfo?.pendingPlan || "pro";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-violet-500/30 p-8 text-center">
          <div className={`w-24 h-24 bg-gradient-to-br ${getPlanColor(pendingPlan)} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
            {getPlanIcon(pendingPlan)}
          </div>
          
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            הפעלת מסלול {planName}
          </h1>
          
          {activationInfo?.firstName && (
            <p className="text-violet-300 text-lg mb-4">
              שלום {activationInfo.firstName}!
            </p>
          )}
          
          <p className="text-slate-400 mb-8">
            לחצו על הכפתור למטה כדי להפעיל את המנוי ולהתחיל ליצור Flows
          </p>

          <div className="bg-violet-500/10 rounded-2xl p-6 mb-8 border border-violet-500/20">
            <h3 className="text-violet-300 font-semibold mb-3">מה כלול במסלול:</h3>
            <ul className="text-slate-300 text-right space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Flows ללא הגבלה</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>משתתפים ללא הגבלה</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>צ'אט AI אישי למשתתפים</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>עמלה מופחתת: {pendingPlan === "business" ? "11%" : "15%"}</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleActivate}
            disabled={activateMutation.isPending}
            size="lg"
            className={`w-full bg-gradient-to-r ${getPlanColor(pendingPlan)} hover:opacity-90 text-white py-6 text-lg font-bold`}
            data-testid="button-activate"
          >
            {activateMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                מפעיל...
              </>
            ) : (
              "להפעיל את המנוי שלי →"
            )}
          </Button>

          {activateMutation.isError && (
            <p className="text-red-400 mt-4 text-sm">
              {activateMutation.error?.message || "שגיאה בהפעלת המנוי. נסו שוב."}
            </p>
          )}

          <p className="text-slate-500 text-sm mt-6">
            לאחר ההפעלה תועברו לדשבורד שלכם
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState("");
  const hasProcessed = useRef(false);

  const urlParams = new URLSearchParams(window.location.search);
  const journeyId = urlParams.get("journeyId");

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async ({ journeyId, email, name }: { journeyId: string; email: string; name: string }) => {
      const res = await fetch(`/api/join/journey/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      return data;
    },
    onSuccess: (data) => {
      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.accessToken) {
        navigate(`/p/${data.accessToken}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setProcessing(false);
    },
  });

  useEffect(() => {
    if (isLoadingUser || hasProcessed.current) return;

    if (!journeyId) {
      navigate("/dashboard");
      return;
    }

    if (user) {
      hasProcessed.current = true;
      const userData = user as any;
      joinMutation.mutate({
        journeyId,
        email: userData.email || "",
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
      });
    } else {
      navigate(`/join/${journeyId}`);
    }
  }, [user, isLoadingUser, navigate, journeyId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4" style={{ color: 'hsl(25 20% 20%)' }}>
            Something went wrong
          </h1>
          <p className="mb-4" style={{ color: 'hsl(25 15% 45%)' }}>{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-full"
            style={{ backgroundColor: 'hsl(145 25% 45%)', color: 'white' }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'hsl(145 25% 45%)' }} />
        <p style={{ color: 'hsl(25 15% 45%)', fontFamily: "'DM Sans', sans-serif" }}>
          {processing ? "Processing your registration..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}

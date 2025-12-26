import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { journeyApi } from "@/lib/api";
import { Loader2, Sparkles } from "lucide-react";

export default function StartFlowPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    const createDraftFlow = async () => {
      if (isCreating) return;
      setIsCreating(true);

      try {
        const journey = await journeyApi.create({
          name: "My New Flow",
          goal: "",
          audience: "",
          duration: 7,
          status: "draft",
          description: "",
        });

        setLocation(`/journeys/new?draft=${journey.id}`);
      } catch (err: any) {
        console.error("Failed to create draft:", err);
        setError(err.message || "Failed to create flow");
        setTimeout(() => {
          setLocation("/journeys");
        }, 2000);
      }
    };

    createDraftFlow();
  }, [authLoading, isAuthenticated, isCreating, setLocation]);

  if (authLoading || isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-violet-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Creating your workspace...
            </h1>
            <p className="text-gray-600">
              Setting up your Flow Builder
            </p>
          </div>
          <Loader2 className="w-8 h-8 mx-auto text-violet-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to your flows...</p>
        </div>
      </div>
    );
  }

  return null;
}

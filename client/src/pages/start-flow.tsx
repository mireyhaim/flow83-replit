import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { journeyApi } from "@/lib/api";
import { Loader2, Sparkles, ArrowRight, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import loginImage from "@assets/ChatGPT_Image_Dec_26,_2025,_06_36_20_PM_1766767014305.png";

export default function StartFlowPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

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

  const handleLogin = () => {
    window.location.href = "/api/login?redirect=/start-flow";
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <Link href="/">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent cursor-pointer inline-block">
                  Flow 83
                </h1>
              </Link>
              <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                Start Building Your Flow
              </h2>
              <p className="mt-2 text-gray-600">
                Sign in to create your first transformative journey
              </p>
            </div>

            <div className="space-y-6">
              <Button
                onClick={handleLogin}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium text-lg"
                data-testid="button-start-free"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-gray-500">
                Sign in to start building your first Flow
              </p>

              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">AI-Powered Journeys</p>
                      <p className="text-sm text-gray-500">Turn your method into personalized daily experiences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Scale Your Practice</p>
                      <p className="text-sm text-gray-500">Help more people with your unique expertise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Your Method, Your Way</p>
                      <p className="text-sm text-gray-500">Full control over your content and pricing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-violet-600" data-testid="link-back-home">
                Back to home
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Image only */}
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

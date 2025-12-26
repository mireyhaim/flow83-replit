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

        {/* Right side - Image */}
        <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-600 overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute bottom-40 right-10 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-violet-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center p-8 text-white w-full">
            <div className="max-w-md text-center mb-4">
              <h3 className="text-3xl font-bold mb-3">
                Create Your First Flow in Minutes
              </h3>
              <p className="text-white/80 text-lg">
                Transform your expertise into a personalized 7-day journey your clients will love.
              </p>
            </div>
            
            {/* Image container with gradient fade */}
            <div className="relative flex-1 flex items-center justify-center w-full max-w-md my-4">
              <div className="relative">
                <img
                  src={loginImage}
                  alt="Mentor using Flow 83"
                  className="w-full max-w-[320px] h-auto object-contain rounded-2xl"
                />
                {/* Bottom gradient fade to blend with background */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-violet-600 via-violet-600/80 to-transparent rounded-b-2xl" />
              </div>
            </div>

            <div className="flex gap-10 text-center">
              <div>
                <div className="text-3xl font-bold">7 days</div>
                <div className="text-white/70 text-sm">Per journey</div>
              </div>
              <div>
                <div className="text-3xl font-bold">AI</div>
                <div className="text-white/70 text-sm">Personalized</div>
              </div>
              <div>
                <div className="text-3xl font-bold">You</div>
                <div className="text-white/70 text-sm">Keep earnings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

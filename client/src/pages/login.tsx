import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Shield } from "lucide-react";
import loginImage from "@assets/stock_images/professional_woman_m_5bea3f46.jpg";

export default function LoginPage() {
  const handleLogin = () => {
    const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/dashboard";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

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
              Welcome to Flow 83
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to continue creating transformative journeys
            </p>
          </div>

          <div className="space-y-6">
            <Button
              onClick={handleLogin}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium text-lg"
              data-testid="button-login"
            >
              Continue with Replit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-center text-sm text-gray-500">
              Sign in with your Replit account to access all features. We support Google, GitHub, and email login.
            </p>

            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Secure & Private</p>
                    <p className="text-sm text-gray-500">Your data is encrypted and never shared</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">AI-Powered Journeys</p>
                    <p className="text-sm text-gray-500">Create personalized experiences for your clients</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Join Thousands of Mentors</p>
                    <p className="text-sm text-gray-500">Build your community and scale your impact</p>
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
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-violet-600 to-fuchsia-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-md text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">
              Transform Your Expertise Into Impact
            </h3>
            <p className="text-white/80 text-lg">
              Join thousands of mentors creating personalized AI-powered journeys for their clients.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-white/20 rounded-3xl blur-xl" />
            <img
              src={loginImage}
              alt="Mentor using Flow 83"
              className="relative rounded-2xl w-80 h-auto shadow-2xl"
            />
          </div>

          <div className="mt-8 flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-white/70">Active Mentors</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50k+</div>
              <div className="text-white/70">Journeys Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold">98%</div>
              <div className="text-white/70">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

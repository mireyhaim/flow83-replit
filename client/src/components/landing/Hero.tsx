import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-300/30 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-300/25 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-300/20 blur-[150px]" />
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="text-gray-900">Share Your </span>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              Wisdom
            </span>
            <br />
            <span className="text-gray-900">Through </span>
            <span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Empower teachers, coaches, and healers to create personalized digital journeys for their clients - 
            powered by AI and your unique expertise.
          </p>
          
          <div className="flex justify-center">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                data-testid="button-hero-get-started"
              >
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-sm">AI-powered content creation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
              <span className="text-sm">Launch in minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8f7ff] to-transparent" />
    </section>
  );
};

export default Hero;

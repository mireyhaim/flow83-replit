import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-[#0f0f23]">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-600/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-white/70">AI-Powered Journey Creation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
            <span className="text-white">Share Your </span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Wisdom
            </span>
            <br />
            <span className="text-white">Through </span>
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed">
            Empower teachers, coaches, and healers to create personalized digital journeys for their clients — 
            powered by AI and your unique expertise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-105"
                data-testid="button-hero-get-started"
              >
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing" className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1" data-testid="link-hero-pricing">
              View Pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm">AI-powered content creation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
              <span className="text-sm">Launch in minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0f23] to-transparent" />
    </section>
  );
};

export default Hero;

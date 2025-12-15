import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import heroBanner from "@assets/generated_images/spiritual_gradient_hero_background.png";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
      
      <div className="container mx-auto px-6 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="max-w-5xl mx-auto">
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight tracking-tight drop-shadow-sm">
            Share Your Wisdom Through Flow
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Empower teachers, coaches, and healers to create personalized digital journeys for their clients — 
            based on their own unique knowledge, tools, and content all powered by artificial intelligence.
          </p>
          
          <div className="flex justify-center">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto rounded-full shadow-spiritual bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
              >
                Start Creating Journeys
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

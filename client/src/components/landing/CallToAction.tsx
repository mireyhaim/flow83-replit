import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Heart } from "lucide-react";
import { Link } from "wouter";

const CallToAction = () => {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <Card className="max-w-5xl mx-auto gradient-card shadow-spiritual border-0 overflow-hidden relative">
           <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm z-0"></div>
          <CardContent className="p-12 md:p-20 text-center relative z-10">
            <div className="flex justify-center mb-8">
              <div className="p-6 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse">
                <Heart className="w-16 h-16 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
              Ready to Share Your Gift?
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Join Flow 83 today and start creating transformational digital journeys that will touch lives and create lasting impact. Your wisdom deserves to flow freely.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/dashboard">
                <Button 
                  size="lg"
                  className="text-lg px-12 py-8 h-auto rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  Start Your Journey as a Guide
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-8 opacity-80">
              Join thousands of guides already creating impact through Flow 83
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;

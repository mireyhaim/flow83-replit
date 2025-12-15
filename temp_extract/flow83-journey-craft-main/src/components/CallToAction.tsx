import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Heart } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-20 gradient-hero">
      <div className="container mx-auto px-6">
        <Card className="max-w-4xl mx-auto gradient-card shadow-spiritual border-0">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ready to Share Your Gift?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join Flow 83 today and start creating transformational digital journeys that will touch lives and create lasting impact. Your wisdom deserves to flow freely.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg"
                className="text-lg px-10 py-4 h-auto"
                asChild
              >
                <a href="/create">
                  Start Your Journey as a Guide
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              Join thousands of guides already creating impact through Flow 83
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;
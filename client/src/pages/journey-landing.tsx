import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, ArrowRight, CheckCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import type { Journey, JourneyStep, JourneyBlock } from "@shared/schema";

interface JourneyWithSteps extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
}

export default function JourneyLandingPage() {
  const [, params] = useRoute("/j/:id");
  const journeyId = params?.id;

  const { data: journey, isLoading, error } = useQuery<JourneyWithSteps>({
    queryKey: ["/api/journeys", journeyId, "full"],
    queryFn: () => fetch(`/api/journeys/${journeyId}/full`).then(res => {
      if (!res.ok) throw new Error("Journey not found");
      return res.json();
    }),
    enabled: !!journeyId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Journey Not Found</h1>
          <p className="text-muted-foreground mb-6">This journey may have been removed or is not available.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (journey.status !== "published") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Journey Not Available</h1>
          <p className="text-muted-foreground mb-6">This journey is not currently published.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  const sortedSteps = [...(journey.steps || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const totalDays = sortedSteps.length || journey.duration || 7;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-journey-title">
                {journey.name}
              </h1>
              {journey.description && (
                <p className="text-xl text-muted-foreground mb-8" data-testid="text-journey-description">
                  {journey.description}
                </p>
              )}
              
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>{totalDays} Days</span>
                </div>
                {journey.audience && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span>For {journey.audience}</span>
                  </div>
                )}
              </div>

              <Link href={`/p/${journey.id}`}>
                <Button size="lg" className="text-lg px-8 py-6" data-testid="button-start-journey">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {journey.goal && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">What You'll Achieve</h2>
                <p className="text-lg text-muted-foreground" data-testid="text-journey-goal">
                  {journey.goal}
                </p>
              </div>
            </div>
          </section>
        )}

        {sortedSteps.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-10">Your {totalDays}-Day Journey</h2>
                <div className="space-y-4">
                  {sortedSteps.map((step, index) => (
                    <Card key={step.id} className="overflow-hidden" data-testid={`card-day-${step.dayNumber}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold">{step.dayNumber}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                            {step.description && (
                              <p className="text-muted-foreground">{step.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Begin your {totalDays}-day journey today and take the first step toward meaningful change.
            </p>
            <Link href={`/p/${journey.id}`}>
              <Button size="lg" data-testid="button-start-journey-bottom">
                Start Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

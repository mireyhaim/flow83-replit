import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowRight, CheckCircle, Sparkles, Heart, Star, User } from "lucide-react";
import type { Journey, JourneyStep, JourneyBlock, User as UserType } from "@shared/schema";

interface JourneyWithMentor extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
  mentor: UserType | null;
}

export default function JourneyLandingPage() {
  const [, params] = useRoute("/j/:id");
  const [, navigate] = useLocation();
  const journeyId = params?.id;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const { data: journey, isLoading, error: fetchError } = useQuery<JourneyWithMentor>({
    queryKey: ["/api/journeys", journeyId, "full"],
    queryFn: () => fetch(`/api/journeys/${journeyId}/full`).then(res => {
      if (!res.ok) throw new Error("Journey not found");
      return res.json();
    }),
    enabled: !!journeyId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/join/journey/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      return data;
    },
    onSuccess: (data) => {
      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.accessToken) {
        navigate(`/p/${data.accessToken}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-purple-600">טוען...</div>
      </div>
    );
  }

  if (fetchError || !journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">התהליך לא נמצא</h1>
          <p className="text-muted-foreground mb-6">התהליך הזה לא קיים או הוסר.</p>
          <Link href="/">
            <Button>חזרה לדף הבית</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (journey.status !== "published") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">התהליך לא זמין</h1>
          <p className="text-muted-foreground mb-6">התהליך הזה עדיין לא פורסם.</p>
          <Link href="/">
            <Button>חזרה לדף הבית</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedSteps = [...(journey.steps || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const totalDays = sortedSteps.length || journey.duration || 7;
  const mentorName = journey.mentor 
    ? `${journey.mentor.firstName || ""} ${journey.mentor.lastName || ""}`.trim() 
    : "המנטור/ית";
  const price = journey.price || 0;
  const isFree = price <= 0;
  const currency = journey.currency || "USD";
  const currencySymbol = "$";

  const handleStartJourney = () => {
    setShowForm(true);
  };

  const handleJoin = () => {
    if (!email) {
      setError("נא להזין כתובת אימייל");
      return;
    }
    setError("");
    joinMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" dir="rtl">
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {journey.mentor && (
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  {journey.mentor.profileImageUrl ? (
                    <img 
                      src={journey.mentor.profileImageUrl} 
                      alt={mentorName}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white rounded-full p-2 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {journey.mentor && (
              <div className="mb-6">
                <p className="text-lg text-purple-600 font-medium mb-1">עם {mentorName}</p>
                {journey.mentor.specialty && (
                  <p className="text-sm text-muted-foreground">{journey.mentor.specialty}</p>
                )}
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent" data-testid="text-journey-title">
              {journey.name}
            </h1>

            {journey.description && (
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto" data-testid="text-journey-description">
                {journey.description}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
              <div className="flex items-center gap-2 text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span>{totalDays} ימים</span>
              </div>
              {journey.audience && (
                <div className="flex items-center gap-2 text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>{journey.audience}</span>
                </div>
              )}
            </div>

            {!showForm ? (
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full"
                onClick={handleStartJourney}
                data-testid="button-start-journey"
              >
                {isFree ? (
                  <>
                    התחילי את המסע
                    <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                  </>
                ) : (
                  <>
                    הצטרפי עכשיו - {currencySymbol}{price}
                    <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
                  </>
                )}
              </Button>
            ) : (
              <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-center">הרשמה לתהליך</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">שם מלא</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="השם שלך"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">אימייל *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        required
                        data-testid="input-email"
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm text-center">{error}</p>
                    )}
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={handleJoin}
                      disabled={!email || joinMutation.isPending}
                      data-testid="button-join"
                    >
                      {joinMutation.isPending ? "מעבד..." : (isFree ? "התחילי עכשיו" : `המשיכי לתשלום - ${currencySymbol}${price}`)}
                    </Button>
                    <button 
                      className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
                      onClick={() => setShowForm(false)}
                    >
                      חזרה
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {journey.mentorMessage && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-white/70 backdrop-blur-sm shadow-lg border-0 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    {journey.mentor?.profileImageUrl ? (
                      <img 
                        src={journey.mentor.profileImageUrl} 
                        alt={mentorName}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                        {journey.mentorMessage}
                      </p>
                      <p className="mt-4 text-purple-600 font-medium">- {mentorName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {journey.goal && (
        <section className="py-12 md:py-16 bg-white/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4" />
                <span className="font-medium">מה תשיגי</span>
              </div>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed" data-testid="text-journey-goal">
                {journey.goal}
              </p>
            </div>
          </div>
        </section>
      )}

      {sortedSteps.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-gray-800">
                המסע שלך ב-{totalDays} ימים
              </h2>
              <div className="space-y-4">
                {sortedSteps.map((step) => (
                  <Card 
                    key={step.id} 
                    className="bg-white/70 backdrop-blur-sm shadow-sm border-0 hover:shadow-md transition-shadow"
                    data-testid={`card-day-${step.dayNumber}`}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                          <span className="text-white font-bold">{step.dayNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-800">{step.title}</h3>
                          {step.description && (
                            <p className="text-gray-600 mt-1 line-clamp-2">{step.description}</p>
                          )}
                        </div>
                        <CheckCircle className="w-5 h-5 text-gray-300 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">מוכנה להתחיל?</h2>
          <p className="text-purple-100 mb-8 max-w-xl mx-auto text-lg">
            התחילי את המסע שלך עוד היום ועשי את הצעד הראשון לקראת שינוי משמעותי.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-purple-700 hover:bg-gray-100 text-lg px-10 py-7 rounded-full shadow-xl"
            onClick={handleStartJourney}
            data-testid="button-start-journey-bottom"
          >
            {isFree ? "התחילי עכשיו" : `הצטרפי עכשיו - ${currencySymbol}${price}`}
            <ArrowRight className="mr-2 w-5 h-5 rotate-180" />
          </Button>
        </div>
      </section>

      <footer className="py-8 bg-gray-50 text-center text-gray-500 text-sm">
        <p>נוצר עם Flow 83</p>
      </footer>
    </div>
  );
}

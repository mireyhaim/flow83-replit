import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, ArrowRight, Check, Quote, Leaf,
  Heart, Compass, Sparkles, Moon, Sun, Star, User 
} from "lucide-react";
import type { Journey, JourneyStep, JourneyBlock, User as UserType } from "@shared/schema";

interface LandingPageContent {
  hero: {
    tagline: string;
    headline: string;
    description: string;
    ctaText: string;
  };
  audience: {
    sectionTitle: string;
    description: string;
    profiles: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    disclaimer: string;
  };
  painPoints: {
    sectionTitle: string;
    points: Array<{
      label: string;
      description: string;
    }>;
    closingMessage: string;
  };
  transformation: {
    sectionTitle: string;
    description: string;
    outcomes: string[];
    quote: string;
  };
  testimonials: Array<{
    name: string;
    text: string;
    feeling: string;
  }>;
  cta: {
    tagline: string;
    headline: string;
    description: string;
    buttonText: string;
    note: string;
  };
}

type JourneyWithMentor = Omit<Journey, 'landingPageContent'> & {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
  mentor: UserType | null;
  landingPageContent?: LandingPageContent | null;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Compass,
  Sparkles,
  Moon,
  Sun,
  Star,
};

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-700">Loading...</div>
      </div>
    );
  }

  if (fetchError || !journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Flow Not Found</h1>
          <p className="text-gray-600 mb-6">This flow doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (journey.status !== "published") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Flow Not Available</h1>
          <p className="text-gray-600 mb-6">This flow hasn't been published yet.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rawContent = journey.landingPageContent as LandingPageContent | undefined;
  const totalDays = journey.steps?.length || journey.duration || 7;
  const mentorName = journey.mentor 
    ? `${journey.mentor.firstName || ""} ${journey.mentor.lastName || ""}`.trim() 
    : "Your Guide";
  const price = journey.price || 0;
  const isFree = price <= 0;
  const currencySymbol = "$";

  // Create fallback content when AI content is not available
  const fallbackContent: LandingPageContent = {
    hero: {
      tagline: "A Journey Towards You",
      headline: journey.name,
      description: journey.description || `A ${totalDays}-day transformational journey with ${mentorName}`,
      ctaText: isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`,
    },
    audience: {
      sectionTitle: "This journey is designed for you",
      description: journey.audience || "You don't need to have everything figured out. This process is most meaningful for those who are still searching, still questioning, still open to discovering something new.",
      profiles: [
        { icon: "Heart", title: "Those Seeking Growth", description: "You sense there's more beneath the surface, and you're ready to explore it gently." },
        { icon: "Compass", title: "People at a Crossroads", description: "You're facing a decision or transition and need clarity to move forward." },
        { icon: "Sparkles", title: "Creative Souls", description: "You want to reconnect with your authentic voice and unlock your potential." },
        { icon: "Moon", title: "Anyone Seeking Peace", description: "You're looking for a moment of stillness in a world that feels too fast." },
      ],
      disclaimer: "This might not be for you if you're looking for quick fixes. This is inner work—gentle, but real.",
    },
    painPoints: {
      sectionTitle: "You might be feeling...",
      points: [
        { label: "Stuck", description: "Like you're going through the motions but not really moving forward. Every day feels the same, and deep down, you know there's something more waiting for you." },
        { label: "Overwhelmed", description: "By the noise—both external and internal. There are so many voices telling you who you should be, what you should want." },
        { label: "Disconnected", description: "From yourself, from your purpose, maybe even from the things that used to bring you joy." },
        { label: "Longing", description: "For something you can't quite name. A sense of meaning. A feeling of being truly seen." },
      ],
      closingMessage: "If any of this resonates, you're in the right place. You're not broken. You're awakening.",
    },
    transformation: {
      sectionTitle: "What awaits you on the other side",
      description: "This isn't about becoming someone new. It's about uncovering who you've always been.",
      outcomes: [
        "A deeper understanding of your values and what truly matters",
        "Clarity about your next steps, even if you can't see the whole path",
        "A renewed sense of connection—to yourself and your purpose",
        "Tools for self-reflection that you can carry always",
        "Permission to be exactly where you are",
        "A feeling of lightness and inner peace",
      ],
      quote: "I can't promise you a perfect life. But I can promise you a more honest relationship with the one you have.",
    },
    testimonials: [
      { name: "Maya", text: "I came in feeling scattered and left feeling whole. For the first time in years, I can hear my own thoughts clearly.", feeling: "Found clarity" },
      { name: "David", text: "This wasn't therapy, it wasn't coaching—it was something gentler. Like having a conversation with the wisest part of myself.", feeling: "Reconnected with inner wisdom" },
      { name: "Sarah", text: "I finally gave myself permission to want what I want. That might sound simple, but for me, it was revolutionary.", feeling: "Embraced authenticity" },
      { name: "Michael", text: "The weight I didn't know I was carrying—it's gone. I breathe easier now. I move through life with more grace.", feeling: "Released burden" },
      { name: "Elena", text: "I stopped fighting myself. I stopped trying to fix what wasn't broken. I just... started listening.", feeling: "Found self-acceptance" },
      { name: "James", text: "At 52, I thought I knew myself. This process showed me there's always more to discover.", feeling: "Discovered new depths" },
    ],
    cta: {
      tagline: "Your Next Step",
      headline: "Ready to begin your gentle journey?",
      description: "There's no pressure here. No urgency. Just an open invitation to explore what's possible when you give yourself permission to pause, reflect, and reconnect.",
      buttonText: isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`,
      note: "Have questions? Reach out anytime. This is a judgment-free space.",
    },
  };

  // Use AI-generated content if available, otherwise use fallback
  const content: LandingPageContent = rawContent || fallbackContent;

  const handleStartJourney = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleJoin = () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setError("");
    joinMutation.mutate();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Heart;
    return IconComponent;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-200 rounded-full blur-3xl opacity-30 animate-pulse" />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {journey.mentor && (
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  {journey.mentor.profileImageUrl ? (
                    <img 
                      src={journey.mentor.profileImageUrl} 
                      alt={mentorName}
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <span className="inline-block text-amber-700 text-sm tracking-widest uppercase mb-6">
              {content.hero.tagline}
            </span>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight mb-8" data-testid="text-journey-title">
              {content.hero.headline}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10" data-testid="text-journey-description">
              {content.hero.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="text-lg px-10 py-6 bg-amber-700 hover:bg-amber-800 rounded-full shadow-lg"
                onClick={handleStartJourney}
                data-testid="button-start-journey"
              >
                {content.hero.ctaText}
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
              <Calendar className="w-5 h-5" />
              <span>{totalDays} days</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-amber-400/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-amber-400/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-24 bg-amber-50/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <span className="inline-block text-rose-600 text-sm tracking-widest uppercase mb-4">
                Is This For You?
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight mb-6">
                {content.audience.sectionTitle}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {content.audience.description}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {content.audience.profiles.map((item, index) => {
                const IconComponent = getIcon(item.icon);
                return (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors duration-300">
                      <IconComponent className="w-7 h-7 text-amber-700" />
                    </div>
                    <h3 className="font-serif text-xl text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {content.audience.disclaimer && (
              <div className="mt-16 max-w-2xl mx-auto text-center">
                <p className="text-gray-500 italic">
                  "{content.audience.disclaimer}"
                </p>
              </div>
            )}
          </div>
        </section>

      {/* Pain Points Section */}
      <section className="py-24 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 border border-amber-300/20 rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] border border-amber-300/10 rounded-full" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block text-amber-700 text-sm tracking-widest uppercase mb-4">
                  We Understand
                </span>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight">
                  {content.painPoints.sectionTitle}
                </h2>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg">
                <div className="space-y-8">
                  {content.painPoints.points.map((point, index) => (
                    <p key={index} className="text-lg md:text-xl text-gray-700 leading-relaxed">
                      <span className={`font-medium ${index % 2 === 0 ? 'text-amber-700' : 'text-rose-600'}`}>
                        {point.label}.
                      </span>{" "}
                      {point.description}
                    </p>
                  ))}
                </div>
                
                {content.painPoints.closingMessage && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="font-serif text-xl md:text-2xl text-gray-800 text-center italic">
                      {content.painPoints.closingMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* Transformation Section */}
      <section className="py-24 bg-amber-50/50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <span className="inline-block text-rose-600 text-sm tracking-widest uppercase mb-4">
                  The Transformation
                </span>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight mb-6">
                  {content.transformation.sectionTitle}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  {content.transformation.description}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {content.transformation.outcomes.map((outcome, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {outcome}
                    </p>
                  </div>
                ))}
              </div>
              
              {content.transformation.quote && (
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-8 md:p-12 text-center">
                  <p className="font-serif text-2xl md:text-3xl text-gray-800 mb-6 italic">
                    "{content.transformation.quote}"
                  </p>
                  <Button 
                    size="lg"
                    className="bg-rose-600 hover:bg-rose-700 rounded-full"
                    onClick={handleStartJourney}
                  >
                    Start Your Transformation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-rose-50 opacity-50" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block text-amber-700 text-sm tracking-widest uppercase mb-4">
                Voices of Transformation
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight">
                What others have{" "}
                <span className="text-rose-600 italic">experienced</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {content.testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group"
                >
                  <Quote className="w-8 h-8 text-amber-200 absolute top-6 right-6 group-hover:text-amber-300 transition-colors" />
                  <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                    "{testimonial.text}"
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-serif text-lg text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {testimonial.feeling}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden" id="signup-form">
        <div className="absolute top-10 left-10 opacity-20">
          <Leaf className="w-20 h-20 text-amber-700" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 rotate-180">
          <Leaf className="w-24 h-24 text-amber-700" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-amber-700 text-sm tracking-widest uppercase mb-6">
              {content.cta.tagline}
            </span>
            
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight mb-6">
              {content.cta.headline}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              {content.cta.description}
            </p>
            
            {!showForm ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button 
                    size="lg"
                    className="text-lg px-10 py-6 bg-rose-600 hover:bg-rose-700 rounded-full shadow-lg"
                    onClick={handleStartJourney}
                    data-testid="button-start-journey-bottom"
                  >
                    {content.cta.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500">
                  {content.cta.note}
                </p>
              </>
            ) : (
              <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6 text-center">Join This Journey</h3>
                  <div className="space-y-4">
                    <div className="text-left">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        data-testid="input-name"
                      />
                    </div>
                    <div className="text-left">
                      <Label htmlFor="email">Email *</Label>
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
                      className="w-full bg-rose-600 hover:bg-rose-700 py-6"
                      onClick={handleJoin}
                      disabled={!email || joinMutation.isPending}
                      data-testid="button-join"
                    >
                      {joinMutation.isPending ? "Processing..." : (isFree ? "Start Now" : `Continue to Payment - ${currencySymbol}${price}`)}
                    </Button>
                    <button 
                      className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
                      onClick={() => setShowForm(false)}
                    >
                      Go back
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">Created with Flow 83</p>
        <p className="text-gray-500 text-xs mt-2">
          {journey.mentor && `By ${mentorName}`}
        </p>
      </footer>
    </div>
  );
}

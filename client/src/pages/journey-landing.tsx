import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, ArrowRight, Check, Quote, Leaf,
  Heart, Compass, Sparkles, Moon, Sun, Star, User, Users 
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
      <div className="min-h-screen lp-gradient-sunset flex items-center justify-center">
        <div className="animate-pulse lp-text-sage lp-font-body">Loading...</div>
      </div>
    );
  }

  if (fetchError || !journey) {
    return (
      <div className="min-h-screen lp-gradient-sunset flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl lp-font-heading font-bold mb-4 lp-text-earth">Flow Not Found</h1>
          <p className="lp-text-muted lp-font-body mb-6">This flow doesn't exist or has been removed.</p>
          <Link href="/">
            <Button className="lp-bg-sage text-white hover:opacity-90">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (journey.status !== "published") {
    return (
      <div className="min-h-screen lp-gradient-sunset flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl lp-font-heading font-bold mb-4 lp-text-earth">Flow Not Available</h1>
          <p className="lp-text-muted lp-font-body mb-6">This flow hasn't been published yet.</p>
          <Link href="/">
            <Button className="lp-bg-sage text-white hover:opacity-90">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rawApiContent = journey.landingPageContent as any;
  let rawContent: LandingPageContent | undefined;
  
  if (rawApiContent) {
    const nested = rawApiContent.landingPage || rawApiContent.landingPageContent || rawApiContent;
    rawContent = {
      hero: nested.hero || nested.heroSection,
      audience: nested.audience || nested.audienceSection,
      painPoints: nested.painPoints || nested.painPointsSection,
      transformation: nested.transformation || nested.transformationSection,
      testimonials: nested.testimonials,
      cta: nested.cta || nested.ctaSection,
    };
  }
  
  const totalDays = journey.steps?.length || journey.duration || 7;
  const mentorName = journey.mentor 
    ? `${journey.mentor.firstName || ""} ${journey.mentor.lastName || ""}`.trim() 
    : "Your Guide";
  const price = journey.price || 0;
  const isFree = price <= 0;
  const currencySymbol = "$";

  const fallbackContent: LandingPageContent = {
    hero: {
      tagline: "A Journey Towards You",
      headline: "A Gentle Path to Inner Clarity",
      description: "This is a process of gentle discovery—a space where you can pause, breathe, and reconnect with what truly matters to you. Through guided reflection and compassionate inquiry, we'll walk together toward a clearer understanding of who you are and where you want to go.",
      ctaText: isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`,
    },
    audience: {
      sectionTitle: "This journey is designed for you",
      description: "You don't need to have everything figured out. In fact, this process is most meaningful for those who are still searching, still questioning, still open to discovering something new about themselves.",
      profiles: [
        { icon: "Heart", title: "Seekers of Self-Understanding", description: "You sense there's more beneath the surface, and you're ready to explore it gently." },
        { icon: "Compass", title: "Those at a Crossroads", description: "You're facing a decision or transition and need clarity to move forward with confidence." },
        { icon: "Sparkles", title: "Creative Souls", description: "You want to reconnect with your authentic voice and unlock your creative potential." },
        { icon: "Moon", title: "Anyone Seeking Peace", description: "You're looking for a moment of stillness in a world that feels too fast." },
      ],
      disclaimer: "This might not be for you if you're looking for quick fixes or external validation. This is inner work—gentle, but real.",
    },
    painPoints: {
      sectionTitle: "You might be feeling...",
      points: [
        { label: "Stuck", description: "Like you're going through the motions but not really moving forward. Every day feels the same, and deep down, you know there's something more waiting for you." },
        { label: "Overwhelmed", description: "By the noise—both external and internal. There are so many voices telling you who you should be, what you should want, how you should feel. And somewhere in all that noise, your own voice got lost." },
        { label: "Disconnected", description: "From yourself, from your purpose, maybe even from the things that used to bring you joy. You catch yourself wondering: \"Is this really it?\"" },
        { label: "Longing", description: "For something you can't quite name. A sense of meaning. A feeling of being truly seen. Permission to be exactly who you are." },
      ],
      closingMessage: "If any of this resonates, you're in the right place. You're not broken. You're awakening.",
    },
    transformation: {
      sectionTitle: "What awaits you on the other side",
      description: "This isn't about becoming someone new. It's about uncovering who you've always been, beneath the layers of expectation and doubt.",
      outcomes: [
        "A deeper understanding of your values and what truly matters to you",
        "Clarity about your next steps, even if you can't see the whole path yet",
        "A renewed sense of connection—to yourself and to your life's purpose",
        "Tools for self-reflection that you can carry with you always",
        "Permission to be exactly where you are, while gently moving forward",
        "A feeling of lightness, as if a weight you didn't know you were carrying has been lifted",
      ],
      quote: "I can't promise you a perfect life. But I can promise you a more honest relationship with the one you have.",
    },
    testimonials: [
      { name: "Maya", text: "I came in feeling scattered and left feeling whole. For the first time in years, I can hear my own thoughts clearly.", feeling: "Found clarity after years of confusion" },
      { name: "David", text: "This wasn't therapy, it wasn't coaching—it was something gentler. Like having a conversation with the wisest part of myself.", feeling: "Reconnected with inner wisdom" },
      { name: "Sarah", text: "I finally gave myself permission to want what I want. That might sound simple, but for me, it was revolutionary.", feeling: "Embraced her authentic desires" },
    ],
    cta: {
      tagline: "Your Next Step",
      headline: "Ready to begin your gentle journey?",
      description: "There's no pressure here. No urgency. Just an open invitation to explore what's possible when you give yourself permission to pause, reflect, and reconnect.",
      buttonText: isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`,
      note: "Have questions? Reach out anytime. This is a judgment-free space.",
    },
  };

  const content: LandingPageContent = rawContent || fallbackContent;

  const handleStartJourney = () => {
    navigate(`/join/${journeyId}`);
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
    <div className="min-h-screen lp-font-body" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center lp-gradient-sunset relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 lp-bg-sage-light rounded-full blur-3xl opacity-40 lp-animate-gentle-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 lp-bg-terracotta-light rounded-full blur-3xl opacity-30 lp-animate-gentle-float lp-animation-delay-400" />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {journey.mentor && (
              <div className="mb-8 flex justify-center opacity-0 lp-animate-fade-up">
                <div className="relative">
                  {journey.mentor.profileImageUrl ? (
                    <img 
                      src={journey.mentor.profileImageUrl} 
                      alt={mentorName}
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white lp-shadow-card object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white lp-shadow-card lp-bg-sage flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <span className="inline-block lp-text-sage lp-font-body text-sm tracking-widest uppercase mb-6 opacity-0 lp-animate-fade-up">
              {content.hero.tagline}
            </span>
            
            <h1 className="lp-font-heading text-4xl md:text-5xl lg:text-6xl lp-text-earth leading-tight mb-8 opacity-0 lp-animate-fade-up lp-animation-delay-200" data-testid="text-journey-title">
              {content.hero.headline.includes("Inner Clarity") ? (
                <>
                  A Gentle Path to{" "}
                  <span className="lp-text-sage italic">Inner Clarity</span>
                </>
              ) : content.hero.headline}
            </h1>
            
            <p className="lp-font-body text-lg md:text-xl lp-text-muted leading-relaxed mb-10 opacity-0 lp-animate-fade-up lp-animation-delay-400" data-testid="text-journey-description">
              {content.hero.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 lp-animate-fade-up lp-animation-delay-600">
              <Button 
                size="lg"
                className="text-lg px-10 py-6 rounded-full"
                style={{ backgroundColor: 'hsl(145 30% 92%)', color: 'hsl(145 25% 45%)', border: '1px solid hsl(145 25% 75%)' }}
                onClick={handleStartJourney}
                data-testid="button-start-journey"
              >
                {isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 rounded-full"
                style={{ backgroundColor: 'white', color: 'hsl(25 20% 20%)', borderColor: '#e5e7eb' }}
                onClick={() => document.getElementById("audience")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 lp-text-muted opacity-0 lp-animate-fade-up lp-animation-delay-800">
              <Calendar className="w-5 h-5" />
              <span className="lp-font-body">{totalDays} days with {mentorName}</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 lp-animate-fade-in lp-animation-delay-800">
          <div className="w-6 h-10 border-2 lp-border-sage rounded-full flex justify-center pt-2" style={{ borderColor: 'hsl(145 25% 45% / 0.4)' }}>
            <div className="w-1.5 h-3 lp-bg-sage rounded-full opacity-60 lp-animate-soft-pulse" />
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section id="audience" className="py-24 lp-bg-cream">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block lp-text-terracotta lp-font-body text-sm tracking-widest uppercase mb-4">
              Is This For You?
            </span>
            <h2 className="lp-font-heading text-3xl md:text-4xl lg:text-5xl lp-text-earth leading-tight mb-6">
              {content.audience.sectionTitle.includes("you") ? (
                <>
                  This journey is designed for{" "}
                  <span className="lp-text-sage italic">you</span>
                </>
              ) : content.audience.sectionTitle}
            </h2>
            <p className="lp-font-body text-lg lp-text-muted leading-relaxed">
              {content.audience.description}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.audience.profiles.map((item, index) => {
              const IconComponent = getIcon(item.icon);
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl lp-shadow-soft hover:lp-shadow-card transition-all duration-300 group"
                >
                  <div className="w-14 h-14 lp-bg-sage-light rounded-xl flex items-center justify-center mb-6 group-hover:lp-bg-sage transition-colors duration-300">
                    <IconComponent className="w-7 h-7 lp-text-sage group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="lp-font-heading text-xl lp-text-earth mb-3">
                    {item.title}
                  </h3>
                  <p className="lp-font-body lp-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
          
          {content.audience.disclaimer && (
            <div className="mt-16 max-w-2xl mx-auto text-center">
              <p className="lp-font-body lp-text-muted italic">
                "{content.audience.disclaimer}"
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-24 lp-gradient-sage relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 border rounded-full" style={{ borderColor: 'hsl(145 25% 45% / 0.2)' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] border rounded-full" style={{ borderColor: 'hsl(145 25% 45% / 0.1)' }} />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block lp-text-sage lp-font-body text-sm tracking-widest uppercase mb-4">
                We Understand
              </span>
              <h2 className="lp-font-heading text-3xl md:text-4xl lg:text-5xl lp-text-earth leading-tight">
                {content.painPoints.sectionTitle}
              </h2>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 lp-shadow-card">
              <div className="space-y-8">
                {content.painPoints.points.map((point, index) => (
                  <p key={index} className="lp-font-body text-lg md:text-xl lp-text-earth leading-relaxed">
                    <span className={`font-medium ${index % 2 === 0 ? 'lp-text-sage' : 'lp-text-terracotta'}`}>
                      {point.label}.
                    </span>{" "}
                    {point.description}
                  </p>
                ))}
              </div>
              
              {content.painPoints.closingMessage && (
                <div className="mt-12 pt-8 border-t" style={{ borderColor: 'hsl(35 20% 88%)' }}>
                  <p className="lp-font-heading text-xl md:text-2xl lp-text-earth text-center italic">
                    {content.painPoints.closingMessage.includes("awakening") ? (
                      <>
                        If any of this resonates, you're in the right place.<br className="hidden md:block" />
                        <span className="lp-text-sage">You're not broken. You're awakening.</span>
                      </>
                    ) : content.painPoints.closingMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className="py-24 lp-bg-cream">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block lp-text-terracotta lp-font-body text-sm tracking-widest uppercase mb-4">
                The Transformation
              </span>
              <h2 className="lp-font-heading text-3xl md:text-4xl lg:text-5xl lp-text-earth leading-tight mb-6">
                {content.transformation.sectionTitle.includes("other side") ? (
                  <>
                    What awaits you on the{" "}
                    <span className="lp-text-sage italic">other side</span>
                  </>
                ) : content.transformation.sectionTitle}
              </h2>
              <p className="lp-font-body text-lg lp-text-muted leading-relaxed max-w-2xl mx-auto">
                {content.transformation.description}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {content.transformation.outcomes.map((outcome, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-white rounded-2xl lp-shadow-soft hover:lp-shadow-card transition-all duration-300"
                >
                  <div className="w-8 h-8 lp-bg-sage-light rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 lp-text-sage" />
                  </div>
                  <p className="lp-font-body lp-text-earth leading-relaxed">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
            
            {content.transformation.quote && (
              <div className="lp-gradient-sage rounded-3xl p-8 md:p-12 text-center">
                <p className="lp-font-heading text-2xl md:text-3xl lp-text-earth mb-6 italic">
                  "{content.transformation.quote}"
                </p>
                <Button 
                  size="lg"
                  className="rounded-full group"
                  style={{ backgroundColor: 'hsl(145 30% 92%)', color: 'hsl(145 25% 45%)', border: '1px solid hsl(145 25% 75%)' }}
                  onClick={handleStartJourney}
                >
                  Start Your Transformation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 lp-gradient-warm opacity-50" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block lp-text-sage lp-font-body text-sm tracking-widest uppercase mb-4">
              Voices of Transformation
            </span>
            <h2 className="lp-font-heading text-3xl md:text-4xl lg:text-5xl lp-text-earth leading-tight mb-8">
              What others have{" "}
              <span className="lp-text-terracotta italic">experienced</span>
            </h2>
            
            {/* Stats Row - Participant Count & Star Rating */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-8">
              {/* Participant Count */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 lp-bg-sage-light rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 lp-text-sage" />
                </div>
                <div className="text-left">
                  <p className="lp-font-heading text-2xl lp-text-earth font-semibold">250+</p>
                  <p className="lp-font-body text-sm lp-text-muted">Completed this journey</p>
                </div>
              </div>
              
              {/* Star Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-6 h-6 fill-current" style={{ color: 'hsl(45 93% 47%)' }} />
                  ))}
                </div>
                <div className="text-left">
                  <p className="lp-font-heading text-2xl lp-text-earth font-semibold">5.0</p>
                  <p className="lp-font-body text-sm lp-text-muted">Average rating</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Show only 3 testimonials */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {content.testimonials.slice(0, 3).map((testimonial, index) => (
              <div
                key={index}
                className="lp-bg-cream p-8 rounded-2xl lp-shadow-soft hover:lp-shadow-card transition-all duration-300 relative group"
              >
                <Quote className="w-8 h-8 absolute top-6 right-6 group-hover:opacity-50 transition-colors" style={{ color: 'hsl(145 25% 45% / 0.3)' }} />
                <p className="lp-font-body lp-text-earth leading-relaxed mb-6 relative z-10">
                  "{testimonial.text}"
                </p>
                <div className="border-t pt-4" style={{ borderColor: 'hsl(35 20% 88%)' }}>
                  <p className="lp-font-heading text-lg lp-text-earth">
                    {testimonial.name}
                  </p>
                  <p className="lp-font-body text-sm lp-text-muted">
                    {testimonial.feeling}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lp-gradient-sage relative overflow-hidden" id="signup-form">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 opacity-20">
          <Leaf className="w-20 h-20 lp-text-sage" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 rotate-180">
          <Leaf className="w-24 h-24 lp-text-sage" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block lp-text-sage lp-font-body text-sm tracking-widest uppercase mb-6">
              {content.cta.tagline}
            </span>
            
            <h2 className="lp-font-heading text-3xl md:text-4xl lg:text-5xl lp-text-earth leading-tight mb-6">
              {content.cta.headline.includes("gentle journey") ? (
                <>
                  Ready to begin your{" "}
                  <span className="lp-text-sage italic">gentle journey</span>?
                </>
              ) : content.cta.headline}
            </h2>
            
            <p className="lp-font-body text-lg md:text-xl lp-text-muted leading-relaxed mb-10">
              {content.cta.description}
            </p>
            
            {!showForm ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button 
                    size="lg"
                    className="text-lg px-10 py-6 rounded-full group"
                    style={{ backgroundColor: 'hsl(145 30% 92%)', color: 'hsl(145 25% 45%)', border: '1px solid hsl(145 25% 75%)' }}
                    onClick={handleStartJourney}
                    data-testid="button-start-journey-bottom"
                  >
                    {isFree ? "Begin Your Journey" : `Join Now - ${currencySymbol}${price}`}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 py-6 rounded-full"
                    style={{ backgroundColor: 'white', color: 'hsl(25 20% 20%)', borderColor: '#e5e7eb' }}
                    onClick={() => window.location.href = `mailto:?subject=Question about ${journey.name}`}
                  >
                    Ask a Question
                  </Button>
                </div>
                
                <p className="lp-font-body text-sm lp-text-muted">
                  {content.cta.note}
                </p>
              </>
            ) : (
              <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm lp-shadow-card border-0">
                <CardContent className="p-8">
                  <h3 className="text-xl lp-font-heading font-semibold mb-6 text-center lp-text-earth">Join This Journey</h3>
                  <div className="space-y-4">
                    <div className="text-left">
                      <Label htmlFor="name" className="lp-text-earth lp-font-body">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 lp-font-body"
                        data-testid="input-name"
                      />
                    </div>
                    <div className="text-left">
                      <Label htmlFor="email" className="lp-text-earth lp-font-body">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 lp-font-body"
                        required
                        data-testid="input-email"
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm text-center lp-font-body">{error}</p>
                    )}
                    <Button 
                      className="w-full py-6"
                      style={{ backgroundColor: 'hsl(145 30% 92%)', color: 'hsl(145 25% 45%)', border: '1px solid hsl(145 25% 75%)' }}
                      onClick={handleJoin}
                      disabled={!email || joinMutation.isPending}
                      data-testid="button-join"
                    >
                      {joinMutation.isPending ? "Processing..." : (isFree ? "Start Now" : `Continue to Payment - ${currencySymbol}${price}`)}
                    </Button>
                    <button 
                      className="text-sm lp-text-muted hover:lp-text-earth w-full text-center lp-font-body"
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
      <footer className="py-8 text-center" style={{ backgroundColor: 'hsl(25 20% 20%)' }}>
        <p className="text-white/60 text-sm lp-font-body">Created with Flow 83</p>
        {journey.mentor && (
          <p className="text-white/40 text-xs mt-2 lp-font-body">By {mentorName}</p>
        )}
      </footer>
    </div>
  );
}

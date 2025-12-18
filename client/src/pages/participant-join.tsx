import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, ArrowLeft, Loader2 } from "lucide-react";

interface JourneyBasic {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  status: string;
  mentor?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function ParticipantJoinPage() {
  const [, params] = useRoute("/join/:journeyId");
  const [, navigate] = useLocation();
  const journeyId = params?.journeyId;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: journey, isLoading } = useQuery<JourneyBasic>({
    queryKey: ["/api/journeys", journeyId, "basic"],
    queryFn: () => fetch(`/api/journeys/${journeyId}`).then(res => {
      if (!res.ok) throw new Error("Journey not found");
      return res.json();
    }),
    enabled: !!journeyId,
  });

  const handleGoogleSignIn = () => {
    const returnTo = encodeURIComponent(`/auth/callback?journeyId=${journeyId}`);
    window.location.href = `/api/login?returnTo=${returnTo}`;
  };

  const handleEmailSignUp = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/join/journey/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to join");
      }

      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.accessToken) {
        navigate(`/p/${data.accessToken}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(145 25% 45%)' }} />
      </div>
    );
  }

  if (!journey || journey.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(25 20% 20%)' }}>
            Flow Not Available
          </h1>
          <p className="mb-6" style={{ fontFamily: "'DM Sans', sans-serif", color: 'hsl(25 15% 45%)' }}>
            This flow is not available for joining.
          </p>
          <Link href="/">
            <Button style={{ backgroundColor: 'hsl(145 25% 45%)', color: 'white' }}>
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const price = journey.price || 0;
  const isFree = price <= 0;
  const currencySymbol = "$";
  const mentorName = journey.mentor 
    ? `${journey.mentor.firstName || ""} ${journey.mentor.lastName || ""}`.trim() 
    : "Your Guide";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
      {/* Header */}
      <header className="p-4">
        <Link href={`/j/${journeyId}`}>
          <Button 
            variant="ghost" 
            className="gap-2"
            style={{ color: 'hsl(145 25% 45%)' }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0" style={{ backgroundColor: 'white' }}>
          <CardHeader className="text-center pb-2">
            {/* Mentor Avatar */}
            {journey.mentor && (
              <div className="flex justify-center mb-4">
                {journey.mentor.profileImageUrl ? (
                  <img 
                    src={journey.mentor.profileImageUrl} 
                    alt={mentorName}
                    className="w-16 h-16 rounded-full border-2 object-cover"
                    style={{ borderColor: 'hsl(145 25% 45%)' }}
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(145 25% 45%)' }}
                  >
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
            )}
            
            <CardTitle 
              className="text-2xl"
              style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(25 20% 20%)' }}
            >
              Join {journey.name}
            </CardTitle>
            <CardDescription 
              className="mt-2"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'hsl(25 15% 45%)' }}
            >
              {isFree ? (
                "Create your account to start this journey"
              ) : (
                <>Create your account to continue to payment</>
              )}
            </CardDescription>
            
            {/* Price Badge */}
            <div className="mt-4">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-lg font-semibold"
                style={{ 
                  backgroundColor: 'hsl(145 30% 92%)', 
                  color: 'hsl(145 25% 45%)',
                  fontFamily: "'Playfair Display', serif"
                }}
              >
                {isFree ? "Free" : `${currencySymbol}${price}`}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Google Sign In */}
            <Button 
              className="w-full py-6 text-base gap-3"
              variant="outline"
              onClick={handleGoogleSignIn}
              data-testid="button-google-signin"
              style={{ borderColor: '#e5e7eb' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm"
                style={{ color: 'hsl(25 15% 45%)', fontFamily: "'DM Sans', sans-serif" }}
              >
                or
              </span>
            </div>

            {/* Email Sign Up Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="name"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: 'hsl(25 20% 20%)' }}
                >
                  Your Name (optional)
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              
              <div className="space-y-2">
                <Label 
                  htmlFor="email"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: 'hsl(25 20% 20%)' }}
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center" data-testid="text-error">
                  {error}
                </p>
              )}

              <Button 
                className="w-full py-6 text-base gap-2"
                onClick={handleEmailSignUp}
                disabled={isSubmitting}
                data-testid="button-email-signup"
                style={{ 
                  backgroundColor: 'hsl(145 30% 92%)', 
                  color: 'hsl(145 25% 45%)',
                  border: '1px solid hsl(145 25% 75%)'
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {isSubmitting ? "Processing..." : (isFree ? "Start Journey" : `Continue to Payment - ${currencySymbol}${price}`)}
              </Button>
            </div>

            <p 
              className="text-xs text-center"
              style={{ color: 'hsl(25 15% 55%)', fontFamily: "'DM Sans', sans-serif" }}
            >
              By continuing, you agree to receive emails about your journey progress.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

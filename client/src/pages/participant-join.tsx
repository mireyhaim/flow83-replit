import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, ArrowLeft, Loader2 } from "lucide-react";

function isHebrewText(text: string): boolean {
  if (!text) return false;
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

interface JourneyBasic {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  price: number | null;
  currency: string | null;
  status: string;
  language: string | null;
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

  // Compute Hebrew detection - must be before useEffect
  const hasHebrewContent = journey ? (isHebrewText(journey.name) || isHebrewText(journey.goal || "") || isHebrewText(journey.description || "")) : false;
  const isHebrew = journey ? (journey.language === 'he' || hasHebrewContent) : false;

  // Set document direction for Hebrew - must be called unconditionally before any early returns
  useEffect(() => {
    if (isHebrew) {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "he";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    }
    return () => {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    };
  }, [isHebrew]);

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

      if (data.requiresPayment) {
        if (data.paymentType === "external" && data.externalPaymentUrl) {
          // Store token for later verification
          localStorage.setItem("external_payment_token", data.token);
          localStorage.setItem("external_payment_return_url", data.returnUrl);
          
          // Check if this is a Grow link (supports iframe)
          const paymentUrl = data.externalPaymentUrl.toLowerCase();
          const isGrowLink = paymentUrl.includes('pay.grow.link') || 
                             paymentUrl.includes('grow.website') ||
                             paymentUrl.includes('meshulam.co.il') || 
                             paymentUrl.includes('grow.business');
          
          if (isGrowLink) {
            // Grow supports iframe - open in embedded payment page
            navigate(`/payment/grow?token=${data.token}&paymentUrl=${encodeURIComponent(data.externalPaymentUrl)}&returnUrl=${encodeURIComponent(data.returnUrl)}`);
          } else {
            // Other providers - use pending confirmation page
            navigate(`/payment/external-pending?token=${data.token}&paymentUrl=${encodeURIComponent(data.externalPaymentUrl)}`);
          }
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else if (data.accessToken) {
        window.location.href = `/p/${data.accessToken}`;
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
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'hsl(25 20% 20%)' }}>
            Flow Not Available
          </h1>
          <p className="mb-6" style={{ color: 'hsl(25 15% 45%)' }}>
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
  const currencySymbol = isHebrew ? "₪" : "$";
  const mentorName = journey.mentor 
    ? `${journey.mentor.firstName || ""} ${journey.mentor.lastName || ""}`.trim() 
    : (isHebrew ? "המנחה שלך" : "Your Guide");

  return (
    <div className={`min-h-screen flex flex-col ${isHebrew ? 'hebrew-landing' : ''}`} style={{ backgroundColor: 'hsl(40 30% 97%)' }}>
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
            {isHebrew ? "חזרה" : "Back"}
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
              className="text-2xl font-semibold"
              style={{ color: 'hsl(25 20% 20%)' }}
            >
              {isHebrew ? `הצטרפות ל${journey.name}` : `Join ${journey.name}`}
            </CardTitle>
            <CardDescription 
              className="mt-2"
              style={{ color: 'hsl(25 15% 45%)' }}
            >
              {isFree ? (
                isHebrew ? "צרו חשבון כדי להתחיל את המסע" : "Create your account to start this journey"
              ) : (
                isHebrew ? "צרו חשבון כדי להמשיך לתשלום" : "Create your account to continue to payment"
              )}
            </CardDescription>
            
            {/* Price Badge */}
            <div className="mt-4">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-lg font-semibold"
                style={{ 
                  backgroundColor: 'hsl(145 30% 92%)', 
                  color: 'hsl(145 25% 45%)'
                }}
              >
                {isFree ? (isHebrew ? "חינם" : "Free") : `${currencySymbol}${price}`}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Email Sign Up Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="name"
                  style={{ color: 'hsl(25 20% 20%)' }}
                >
                  {isHebrew ? "השם שלך" : "Your Name"}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={isHebrew ? "הזינו את שמכם" : "Enter your name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label 
                  htmlFor="email"
                  style={{ color: 'hsl(25 20% 20%)' }}
                >
                  {isHebrew ? "כתובת אימייל" : "Email Address"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>

              <p 
                className="text-sm text-center"
                style={{ color: 'hsl(25 15% 50%)' }}
              >
                {isHebrew 
                  ? "פרטים אלו ישמשו אותך לכניסה לפלואו בעתיד" 
                  : "These details will be used to access your flow in the future"}
              </p>

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
                {isSubmitting 
                  ? (isHebrew ? "מעבד..." : "Processing...") 
                  : (isFree 
                      ? (isHebrew ? "התחילו את המסע" : "Start Journey") 
                      : (isHebrew ? `המשך לתשלום - ${currencySymbol}${price}` : `Continue to Payment - ${currencySymbol}${price}`)
                    )
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

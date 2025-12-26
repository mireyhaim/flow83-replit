import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const pricingPlans = [
  {
    name: "Starter",
    planId: "starter" as const,
    price: "$26",
    period: "/month",
    trialText: "Includes a 7-day free trial",
    description: "The simplest, fastest, and most affordable way to launch your first journey and start selling online - without a website, without tech skills, and without risk.",
    features: [
      "1 active Journey (Flow)",
      "Up to 60 users",
      "$0.60 per user above 60",
      "Personal sales landing page",
      "Direct payment integration (money goes to you)",
      "Full cloud hosting",
      "Analytics dashboard"
    ],
    bestFor: "Mentors who want to start fast, learn the platform, and make their first sales.",
    buttonText: "Start Free Trial",
    popular: false
  },
  {
    name: "Pro",
    planId: "pro" as const,
    price: "$83",
    period: "/month",
    trialText: null,
    description: "For mentors who are already selling and want to grow - with more journeys, more clients, and deeper performance visibility.",
    features: [
      "Up to 5 active Journeys",
      "Up to 300 users",
      "$0.60 per user above 300",
      "Personal sales landing page for each journey",
      "Direct payment integration (money goes to you)",
      "Full cloud hosting",
      "Advanced AI Flow Composer",
      "Extended data dashboard"
    ],
    bestFor: "Mentors ready to scale their business into consistent monthly revenue.",
    buttonText: "Upgrade to Pro",
    popular: true
  },
  {
    name: "Business",
    planId: "business" as const,
    price: "$188",
    period: "/month",
    trialText: null,
    description: "For established mentors and growing schools who want to offer multiple journeys at scale — with bigger audiences, more products, and true long-term revenue.",
    features: [
      "Up to 10 active Journeys",
      "Up to 1000 users",
      "$0.40 per user above 1000",
      "Personal sales landing page for each journey",
      "Direct payment integration (money goes to you)",
      "Full cloud hosting",
      "Advanced AI Flow Composer",
      "Extended data dashboard"
    ],
    bestFor: "Mentors and organizations who are ready to scale multiple journeys, build a product portfolio, and earn consistently at volume.",
    buttonText: "Scale Your Business",
    popular: false
  }
];

type PlanId = "starter" | "pro" | "business";

const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const { isAuthenticated } = useAuth();

  const handleSubscribe = async (planId: PlanId) => {
    if (!isAuthenticated) {
      window.location.href = `/api/login?returnTo=/pricing`;
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await apiRequest("POST", "/api/subscription/checkout", { plan: planId });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900">Choose the plan that turns your </span>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              method into automated income
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-4 leading-relaxed">
            Three levels - start, grow, and scale.
          </p>
          <p className="text-lg text-gray-500 max-w-4xl mx-auto leading-relaxed">
            All plans include a personal sales landing page, payment integration (funds go directly to you), cloud hosting, and a mentor dashboard.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col ${
                  plan.popular ? 'ring-2 ring-violet-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center mt-4">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-1 text-lg">{plan.period}</span>
                  </div>
                  {plan.trialText && (
                    <p className="text-violet-600 font-medium mt-2">{plan.trialText}</p>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-900 mb-3">What's included:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-violet-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6 p-4 bg-violet-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Best for:</p>
                    <p className="text-gray-600 text-sm">{plan.bestFor}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      className="w-full text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                      onClick={() => handleSubscribe(plan.planId)}
                      disabled={loadingPlan !== null}
                      data-testid={`button-subscribe-${plan.planId}`}
                    >
                      {loadingPlan === plan.planId ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : null}
                      {plan.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does the 7-day free trial work?
              </h3>
              <p className="text-gray-600">
                Sign up for the Starter plan and get 7 full days to explore the platform. Build your first journey, preview everything risk-free. After 7 days, automatic billing of $26/month begins. You can cancel anytime before the trial ends.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my user limit?
              </h3>
              <p className="text-gray-600">
                If you go over your included users, you'll be charged $0.60 per additional user. Usage is calculated monthly and added to your next invoice.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes, you can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the start of your next billing cycle.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do payments work? Do you take a percentage?
              </h3>
              <p className="text-gray-600">
                No, we never take a percentage of your earnings. Payments from your participants go directly to your connected Stripe account. You keep 100% of what you earn (minus standard Stripe processing fees).
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What counts as a "user"?
              </h3>
              <p className="text-gray-600">
                A user is anyone who actively participates in your journey. This includes anyone who signs up and engages with your flow content, whether they paid or accessed it for free.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel anytime. Your access continues until the end of your current billing period. There are no cancellation fees or long-term commitments.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-12 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              100% of your revenue - stays yours.
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We don't take percentages, we don't touch your income, and we don't interfere with your client relationships.
            </p>
            
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to begin?</h3>
              <p className="text-gray-600 mb-6">
                Your first journey can be live today. AI builds the process, the site goes live, and payments flow directly to you.
              </p>
              <Button 
                className="text-lg px-10 py-5 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                onClick={() => handleSubscribe("starter")}
                disabled={loadingPlan !== null}
                data-testid="button-cta-free-trial"
              >
                {loadingPlan === "starter" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Start Free Trial
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;

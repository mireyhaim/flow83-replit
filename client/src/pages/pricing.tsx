import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started with Flow 83",
    features: [
      "1 Flow",
      "Up to 20 users",
      "AI journey builder (Flow Composer)",
      "Content hosting (text/audio/video)",
      "Personal progress tracking per user"
    ],
    popular: false
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Great for launching your first journey",
    features: [
      "1 Flow",
      "Up to 500 users",
      "$0.10/user/month beyond 500",
      "AI journey builder (Flow Composer)",
      "Content hosting (text/audio/video)",
      "Personal progress tracking per user"
    ],
    popular: false
  },
  {
    name: "Creator",
    price: "$83",
    period: "/month",
    description: "Ideal for active guides with multiple journeys",
    features: [
      "Up to 5 Flows",
      "Up to 2,000 users",
      "$0.08/user/month beyond 2,000",
      "AI journey builder (Flow Composer)",
      "Content hosting (text/audio/video)",
      "Personal progress tracking per user"
    ],
    popular: true
  }
];

const addOns = [
  {
    name: "Custom domain",
    price: "$5/month"
  },
  {
    name: "Flow analytics dashboard",
    price: "$9/month"
  },
  {
    name: "Community space per Flow",
    price: "$12/month"
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan to transform your practice and reach more people with your expertise
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative gradient-card border-0 shadow-card hover:shadow-spiritual transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center mt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Add-ons */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            💬 Add‑ons (Optional)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="text-center border hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{addon.name}</h3>
                  <p className="text-2xl font-bold text-primary">{addon.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                How do user overages work?
              </h3>
              <p className="text-muted-foreground">
                Each plan includes a certain number of users. If you exceed this limit, you'll be charged per additional user at the rates shown above. Usage is calculated monthly.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Can I change my plan at any time?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and any overage charges are prorated.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                What counts as a "user"?
              </h3>
              <p className="text-muted-foreground">
                A user is anyone who actively engages with your Flow content. This includes participants who complete exercises, track progress, or interact with your journey materials.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Can I upgrade from the free plan?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade from the free plan to any paid plan at any time. Your existing flow and user data will be preserved during the upgrade.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;

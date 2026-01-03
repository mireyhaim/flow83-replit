import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation('landing');
  const isHebrew = i18n.language === 'he';

  const getStartLink = () => {
    return isAuthenticated ? "/dashboard" : "/start-flow";
  };

  const SHOW_ALL_PLANS = false;

  const prices = isHebrew 
    ? { starter: "₪83", pro: "₪183", business: "₪283" }
    : { starter: "$26", pro: "$83", business: "$188" };

  const pricingPlans = [
    {
      name: t('pricingPage.starter'),
      planId: "starter" as const,
      price: prices.starter,
      period: t('pricingPage.perMonth'),
      trialText: t('pricingPage.includes7DayTrial'),
      description: t('pricingPage.starterDesc'),
      features: [
        t('pricingPage.feature1Flow'),
        t('pricingPage.feature60Users'),
        t('pricingPage.featureSalesPage'),
        t('pricingPage.featureDirectPayment'),
        t('pricingPage.featureCloudHosting'),
        t('pricingPage.featureAnalytics')
      ],
      bestFor: t('pricingPage.starterBestFor'),
      buttonText: t('pricingPage.startFreeTrial'),
      popular: false,
      visible: true
    },
    {
      name: t('pricingPage.pro'),
      planId: "pro" as const,
      price: prices.pro,
      period: t('pricingPage.perMonth'),
      trialText: null,
      description: t('pricingPage.proDesc'),
      features: [
        t('pricingPage.feature5Flows'),
        t('pricingPage.feature300Users'),
        t('pricingPage.featureExtra300'),
        t('pricingPage.featureSalesPageEach'),
        t('pricingPage.featureDirectPayment'),
        t('pricingPage.featureCloudHosting'),
        t('pricingPage.featureExtendedDashboard')
      ],
      bestFor: t('pricingPage.proBestFor'),
      buttonText: t('pricingPage.upgradeToPro'),
      popular: true,
      visible: SHOW_ALL_PLANS
    },
    {
      name: t('pricingPage.business'),
      planId: "business" as const,
      price: prices.business,
      period: t('pricingPage.perMonth'),
      trialText: null,
      description: t('pricingPage.businessDesc'),
      features: [
        t('pricingPage.feature10Flows'),
        t('pricingPage.feature1000Users'),
        t('pricingPage.featureExtra1000'),
        t('pricingPage.featureSalesPageEach'),
        t('pricingPage.featureDirectPayment'),
        t('pricingPage.featureCloudHosting'),
        t('pricingPage.featureAdvancedAI'),
        t('pricingPage.featureExtendedDashboard')
      ],
      bestFor: t('pricingPage.businessBestFor'),
      buttonText: t('pricingPage.scaleYourBusiness'),
      popular: false,
      visible: SHOW_ALL_PLANS
    }
  ].filter(plan => plan.visible);

  const faqs = [
    { q: t('pricingPage.faq1Q'), a: t('pricingPage.faq1A') },
    { q: t('pricingPage.faq2Q'), a: t('pricingPage.faq2A') },
    { q: t('pricingPage.faq3Q'), a: t('pricingPage.faq3A') },
    { q: t('pricingPage.faq4Q'), a: t('pricingPage.faq4A') },
    { q: t('pricingPage.faq5Q'), a: t('pricingPage.faq5A') },
    { q: t('pricingPage.faq6Q'), a: t('pricingPage.faq6A') }
  ];

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="pt-20">
        <section className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-gray-900">{t('pricingPage.title')} </span>
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              {t('pricingPage.titleHighlight')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-4 leading-relaxed">
            {t('pricingPage.subtitle')}
          </p>
          <p className="text-lg text-gray-500 max-w-4xl mx-auto leading-relaxed">
            {t('pricingPage.subtitleDetails')}
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex justify-center">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className="relative bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col max-w-md w-full"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('pricingPage.mostPopular')}
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
                    <p className="text-sm font-semibold text-gray-900 mb-3">{t('pricingPage.whatsIncluded')}</p>
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
                    <p className="text-sm font-semibold text-gray-900 mb-1">{t('pricingPage.bestFor')}</p>
                    <p className="text-gray-600 text-sm">{plan.bestFor}</p>
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      className="w-full text-lg px-8 py-4 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                      data-testid={`button-subscribe-${plan.planId}`}
                      onClick={() => {
                        if (isAuthenticated) {
                          // Route Hebrew users to Grow, English users to LemonSqueezy
                          const lemonSqueezyUrls: Record<string, string> = {
                            starter: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
                            pro: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
                            business: 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0',
                          };
                          const growUrls: Record<string, string> = {
                            starter: 'https://pay.grow.link/345b96922ae5b62bf5b91c8a4828a3bc-MjkyNzAzNQ',
                            pro: '',
                            business: '',
                          };
                          const checkoutUrls = isHebrew ? growUrls : lemonSqueezyUrls;
                          const baseUrl = checkoutUrls[plan.planId] || lemonSqueezyUrls[plan.planId];
                          
                          if (!baseUrl) {
                            alert(t('pricingPage.paymentNotConfigured', 'Payment link not configured yet. Please contact support.'));
                            return;
                          }
                          
                          const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
                          window.open(`${baseUrl}&checkout[redirect_url]=${returnUrl}`, '_blank');
                        } else {
                          window.location.href = '/start-flow';
                        }
                      }}
                    >
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
            {t('pricingPage.faq')}
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-12 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('pricingPage.revenue100')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('pricingPage.revenue100Desc')}
            </p>
            
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('pricingPage.readyToBegin')}</h3>
              <p className="text-gray-600 mb-6">
                {t('pricingPage.readyToBeginDesc')}
              </p>
              <Button 
                className="text-lg px-10 py-5 h-auto rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                data-testid="button-cta-free-trial"
                onClick={() => {
                  if (isAuthenticated) {
                    // Route Hebrew users to Grow, English users to LemonSqueezy
                    const baseUrl = isHebrew 
                      ? 'https://pay.grow.link/345b96922ae5b62bf5b91c8a4828a3bc-MjkyNzAzNQ'
                      : 'https://flow83.lemonsqueezy.com/checkout/buy/93676b93-3c23-476a-87c0-a165d9faad36?media=0';
                    
                    if (!baseUrl) {
                      alert(t('pricingPage.paymentNotConfigured', 'Payment link not configured yet. Please contact support.'));
                      return;
                    }
                    
                    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscription=success`);
                    window.open(`${baseUrl}&checkout[redirect_url]=${returnUrl}`, '_blank');
                  } else {
                    window.location.href = '/start-flow';
                  }
                }}
              >
                {t('pricingPage.startFreeTrial')}
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

import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Check, Sparkles, TrendingUp, Rocket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function PricingPage() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === "he";
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = (plan: "free" | "pro" | "scale") => {
    if (plan === "free") {
      navigate("/dashboard");
    } else if (plan === "pro") {
      window.open("https://pay.grow.link/54d615f118268848c0362dcce29d9342-MzAxMzg1NA", "_blank");
    } else if (plan === "scale") {
      window.open("https://pay.grow.link/0cd88fd0e903238964074836c355c761-MzAxNDM2OA", "_blank");
    }
  };

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      nameHe: "התחלה",
      icon: Sparkles,
      price: 0,
      description: isHebrew ? "בלי תשלום חודשי" : "No monthly fee",
      idealFor: isHebrew
        ? ["מי שרוצה לנסות את הפלטפורמה", "בניית ה-Flow הראשון", "בדיקת התאמה לקהל"]
        : ["Try the platform", "Build your first Flow", "Test audience fit"],
      features: isHebrew
        ? [
            "Flows ללא הגבלה",
            "משתתפים ללא הגבלה",
            "צ'אט AI אישי למשתתפים",
            "גבייה אוטומטית",
            "חשבוניות עצמיות",
            "עמלה למשתתף: 17%",
          ]
        : [
            "Unlimited Flows",
            "Unlimited participants",
            "AI chat for participants",
            "Automatic payments",
            "Self-billing invoices",
            "Commission per participant: 17%",
          ],
      tagline: isHebrew
        ? "מתחילים בחינם, משלמים רק כשמרוויחים."
        : "Start free, pay only when you earn.",
      cta: isHebrew ? "להתחיל בחינם" : "Start Free",
    },
    {
      id: "pro" as const,
      name: "Pro",
      nameHe: "מקצועי",
      icon: TrendingUp,
      price: 55,
      description: isHebrew ? "לצמיחה עסקית" : "For business growth",
      idealFor: isHebrew
        ? ["מי שכבר מוכר", "רוצה להגדיל הכנסות", "מחפש עמלה נמוכה יותר"]
        : ["Already selling", "Want to grow revenue", "Looking for lower fees"],
      features: isHebrew
        ? [
            "כל מה שב-התחלה",
            "דוחות על משתתפים והכנסות",
            "ניהול מתקדם של Flows",
            "עמלה למשתתף: 15%",
          ]
        : [
            "Everything in Free",
            "Participant & revenue reports",
            "Advanced Flow management",
            "Commission per participant: 15%",
          ],
      tagline: isHebrew
        ? "עמלה נמוכה יותר = יותר כסף בכיס."
        : "Lower commission = more money in your pocket.",
      cta: isHebrew ? "לשדרג ל-Pro" : "Upgrade to Pro",
      popular: true,
    },
    {
      id: "scale" as const,
      name: "Scale",
      nameHe: "עסק",
      icon: Rocket,
      price: 83,
      description: isHebrew ? "להיקפים גדולים" : "For high volume",
      idealFor: isHebrew
        ? ["עסק עם קהל קבוע", "הרבה משתתפים בחודש", "רוצה את העמלה הכי נמוכה"]
        : ["Established business", "High monthly volume", "Want the lowest fees"],
      features: isHebrew
        ? [
            "כל מה שב-Pro",
            "העמלה הנמוכה ביותר",
            "מותאם לפעילות בהיקף גבוה",
            "עמלה למשתתף: 11%",
          ]
        : [
            "Everything in Pro",
            "Lowest commission rate",
            "Built for high volume",
            "Commission per participant: 11%",
          ],
      tagline: isHebrew
        ? "ככל שגדלים – משלמים פחות על כל משתתף."
        : "The more you grow – the less you pay per participant.",
      cta: isHebrew ? "לבחור Scale" : "Choose Scale",
    },
  ];

  const faqs = isHebrew
    ? [
        {
          q: "מה זה עמלת משתתף?",
          a: "FLOW83 גובה עמלה מכל תשלום שמשתתף מבצע עבור התהליך. גובה העמלה תלוי במסלול שלכם: 17% במסלול התחלה, 15% במסלול מקצועי, ו-11% במסלול עסק.",
        },
        {
          q: "האם אפשר לשנות מסלול?",
          a: "כן. אפשר לשדרג או להוריד מסלול בכל רגע, בלי קנסות.",
        },
        {
          q: "יש התחייבות?",
          a: "לא. אין התחייבות שנתית או מינימום זמן.",
        },
        {
          q: "מה זה אומר Self-Billing?",
          a: "המערכת מפיקה חשבוניות בשמכם, בהתאם להסכם, ואתם לא צריכים להתעסק בזה ידנית.",
        },
        {
          q: "FLOW83 לוקחת כסף גם אם אין משתתפים?",
          a: "רק במסלולים מקצועי ועסק יש תשלום חודשי. במסלול התחלה – אין תשלום אם אין מכירות.",
        },
      ]
    : [
        {
          q: "What is the participant commission?",
          a: "FLOW83 charges a commission on every payment a participant makes for your Flow. The rate depends on your plan: 17% on Free, 15% on Pro, and 11% on Scale.",
        },
        {
          q: "Can I change my plan?",
          a: "Yes. You can upgrade or downgrade at any time, without penalties.",
        },
        {
          q: "Is there a commitment?",
          a: "No. There is no annual commitment or minimum time.",
        },
        {
          q: "What is Self-Billing?",
          a: "The system generates invoices on your behalf according to the agreement, so you don't need to handle it manually.",
        },
        {
          q: "Does FLOW83 charge if there are no participants?",
          a: "Only Pro and Scale plans have monthly fees. Free plan – no payment if no sales.",
        },
      ];

  return (
    <div className="min-h-screen bg-[#f8f7ff] font-sans selection:bg-violet-500/20 selection:text-violet-300">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-gray-900">{isHebrew ? "בחרו את " : "Choose your "}</span>
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                {isHebrew ? "הקצב" : "pace"}
              </span>
              <span className="text-gray-900">{isHebrew ? " שמתאים לכם" : ""}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {isHebrew
                ? "FLOW83 נבנתה כדי לאפשר למנטורים, מורים ויוצרי שיטות להפוך ידע עמוק לתהליך דיגיטלי חי – בלי לוותר על האותנטיות."
                : "FLOW83 was built to enable mentors, teachers, and method creators to transform deep knowledge into a living digital process – without losing authenticity."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-500" />
                {isHebrew ? "אין התחייבות" : "No commitment"}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-500" />
                {isHebrew ? "אין אותיות קטנות" : "No fine print"}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-500" />
                {isHebrew ? "שינוי מסלול בכל רגע" : "Change plans anytime"}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan) => {
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative bg-white rounded-2xl border border-gray-200 p-6 transition-all hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200",
                    plan.popular && "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#f8f7ff]"
                  )}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-violet-600 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg shadow-violet-500/30">
                        {isHebrew ? "פופולרי" : "Popular"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{isHebrew ? plan.nameHe : plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">₪{plan.price}</span>
                      <span className="text-gray-500">/{isHebrew ? "חודש" : "month"}</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {isHebrew ? "מתאים למי:" : "Ideal for:"}
                    </p>
                    <ul className="space-y-1.5 text-sm text-gray-600">
                      {plan.idealFor.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {isHebrew ? "מה כלול:" : "What's included:"}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-gray-500 italic mb-6">{plan.tagline}</p>

                  <Button
                    className={cn(
                      "w-full rounded-full text-white shadow-lg transition-all",
                      plan.popular 
                        ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/30" 
                        : "bg-gray-800 hover:bg-gray-900 shadow-gray-500/20"
                    )}
                    onClick={() => handleSelectPlan(plan.id)}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              {isHebrew ? "שאלות נפוצות" : "FAQ"}
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-violet-200 transition-colors"
                  data-testid={`faq-item-${index}`}
                >
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between text-start hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        openFaq === index && "rotate-180"
                      )}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 text-gray-600">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 text-center">
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              {isHebrew
                ? "FLOW83 לא נבנתה כדי להחליף אתכם. היא נבנתה כדי לאפשר לשיטה שלכם לעבוד גם כשאתם לא שם."
                : "FLOW83 wasn't built to replace you. It was built to let your method work even when you're not there."}
            </p>
            <p className="text-violet-600 font-semibold text-lg">
              {isHebrew
                ? "בחרו מסלול, בנו Flow, ותנו לתהליך להוביל."
                : "Choose a plan, build a Flow, and let the process lead."}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export { PricingPage as Pricing };

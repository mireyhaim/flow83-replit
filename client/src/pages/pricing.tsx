import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Check, Sparkles, TrendingUp, Rocket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === "he";
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSelectPlan = (plan: "free" | "pro" | "scale") => {
    if (plan === "free") {
      navigate("/dashboard");
    } else {
      window.location.href = `/api/subscription/checkout?plan=${plan}`;
    }
  };

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      nameHe: "חינם",
      icon: Sparkles,
      price: 0,
      commission: 17,
      color: "emerald",
      description: isHebrew ? "התחלה חופשית, בלי תשלום חודשי" : "Free start, no monthly payment",
      idealFor: isHebrew
        ? ["להתנסות בפלטפורמה", "לבנות Flow ראשון", "לבדוק איך הקהל מגיב לתהליך"]
        : ["Try the platform", "Build your first Flow", "Test audience response"],
      features: isHebrew
        ? [
            "יצירת Flows והפעלתם",
            "צ'אט AI מלווה תהליך",
            "גבייה אוטומטית דרך המערכת",
            "הפקת חשבוניות (Self-Billing)",
            "ללא התחייבות חודשית",
          ]
        : [
            "Create and run Flows",
            "AI-powered chat experience",
            "Automatic payment collection",
            "Self-Billing invoices",
            "No monthly commitment",
          ],
      tagline: isHebrew
        ? "מושלם להתחלה. משלמים רק כשיש משתתפים."
        : "Perfect to start. Pay only when you have participants.",
      cta: isHebrew ? "התחילו ללא התחייבות" : "Start Free",
    },
    {
      id: "pro" as const,
      name: "Pro",
      nameHe: "Pro",
      icon: TrendingUp,
      price: 55,
      commission: 15,
      color: "blue",
      description: isHebrew ? "לצמיחה יציבה ומכירות ראשונות" : "For stable growth and first sales",
      idealFor: isHebrew
        ? ["שכבר התחיל למכור", "רוצה להגדיל נפח", "מחפש איזון בין עלות להכנסה"]
        : ["Already started selling", "Want to increase volume", "Looking for cost-revenue balance"],
      features: isHebrew
        ? [
            "כל מה שבמסלול Free",
            "עמלה נמוכה יותר",
            "ניהול מתקדם של Flows",
            "דוחות בסיסיים על משתתפים והכנסות",
          ]
        : [
            "Everything in Free",
            "Lower commission rate",
            "Advanced Flow management",
            "Basic reports on participants and revenue",
          ],
      tagline: isHebrew
        ? "ברגע שמתחילים למכור – זה משתלם."
        : "Once you start selling – it pays off.",
      cta: isHebrew ? "עברו ל-Pro" : "Go Pro",
      popular: true,
    },
    {
      id: "scale" as const,
      name: "Scale",
      nameHe: "Scale",
      icon: Rocket,
      price: 83,
      commission: 11,
      color: "violet",
      description: isHebrew
        ? "למנטורים שבונים עסק דיגיטלי אמיתי"
        : "For mentors building a real digital business",
      idealFor: isHebrew
        ? ["עובד עם קהל קבוע", "רוצה להרחיב תהליכים", "חושב לטווח ארוך"]
        : ["Working with regular audience", "Want to expand processes", "Thinking long-term"],
      features: isHebrew
        ? [
            "כל מה שב-Pro",
            "העמלה הנמוכה ביותר",
            "מתאים להיקפי פעילות גדולים",
          ]
        : [
            "Everything in Pro",
            "Lowest commission rate",
            "Suitable for large-scale operations",
          ],
      tagline: isHebrew
        ? "כשזה כבר עובד – כדאי לשלם פחות על כל משתתף."
        : "When it's working – better to pay less per participant.",
      cta: isHebrew ? "בחרו ב-Scale" : "Choose Scale",
    },
  ];

  const faqs = isHebrew
    ? [
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
          a: "רק במסלולים Pro ו-Scale יש תשלום חודשי. במסלול Free – אין תשלום אם אין מכירות.",
        },
      ]
    : [
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

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-100",
      badge: "bg-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      iconBg: "bg-blue-100",
      badge: "bg-blue-500",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-200",
      icon: "text-violet-600",
      iconBg: "bg-violet-100",
      badge: "bg-violet-500",
      button: "bg-violet-600 hover:bg-violet-700",
    },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <header className="py-6 px-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-violet-600" data-testid="link-logo">
            FLOW83
          </Link>
          <Button variant="outline" asChild data-testid="button-login">
            <a href="/api/login">{isHebrew ? "התחברות" : "Login"}</a>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            {isHebrew
              ? "בחרו את הקצב שמתאים לכם – ואנחנו נצמח איתכם"
              : "Choose your pace – and we'll grow with you"}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {isHebrew
              ? "FLOW83 נבנתה כדי לאפשר למנטורים, מורים ויוצרי שיטות להפוך ידע עמוק לתהליך דיגיטלי חי – בלי לוותר על האותנטיות."
              : "FLOW83 was built to enable mentors, teachers, and method creators to transform deep knowledge into a living digital process – without losing authenticity."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              {isHebrew ? "אין התחייבות" : "No commitment"}
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              {isHebrew ? "אין אותיות קטנות" : "No fine print"}
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              {isHebrew ? "שינוי מסלול בכל רגע" : "Change plans anytime"}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const colors = colorClasses[plan.color as keyof typeof colorClasses];
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border-2 p-6 transition-all hover:shadow-lg",
                  colors.bg,
                  colors.border,
                  plan.popular && "ring-2 ring-blue-400 ring-offset-2"
                )}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {isHebrew ? "פופולרי" : "Popular"}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.iconBg)}>
                    <Icon className={cn("w-5 h-5", colors.icon)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{isHebrew ? plan.nameHe : plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₪{plan.price}</span>
                    <span className="text-slate-500">/{isHebrew ? "חודש" : "month"}</span>
                  </div>
                  <div className={cn("inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium text-white", colors.badge)}>
                    {plan.commission}% {isHebrew ? "עמלה לכל משתתף" : "commission per participant"}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {isHebrew ? "מתאים למי:" : "Ideal for:"}
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {plan.idealFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {isHebrew ? "מה כלול:" : "What's included:"}
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-slate-500 italic mb-6">{plan.tagline}</p>

                <Button
                  className={cn("w-full text-white", colors.button)}
                  onClick={() => handleSelectPlan(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  👉 {plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            {isHebrew ? "שאלות נפוצות" : "FAQ"}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                data-testid={`faq-item-${index}`}
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-start hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-slate-400 transition-transform",
                      openFaq === index && "rotate-180"
                    )}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 text-slate-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-slate-700 mb-4">
            {isHebrew
              ? "FLOW83 לא נבנתה כדי להחליף אתכם. היא נבנתה כדי לאפשר לשיטה שלכם לעבוד גם כשאתם לא שם."
              : "FLOW83 wasn't built to replace you. It was built to let your method work even when you're not there."}
          </p>
          <p className="text-violet-600 font-medium">
            {isHebrew
              ? "בחרו מסלול, בנו Flow, ותנו לתהליך להוביל."
              : "Choose a plan, build a Flow, and let the process lead."}
          </p>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-100 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          © 2024 FLOW83. {isHebrew ? "כל הזכויות שמורות." : "All rights reserved."}
        </div>
      </footer>
    </div>
  );
}

export { PricingPage as Pricing };

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Database, Settings, Users, CreditCard, Shield, HeartPulse, UserCheck, RefreshCw } from "lucide-react";

const privacyContent = [
  {
    icon: Database,
    title: "Information We Collect",
    content: "We collect: account information (name, email, password), basic usage data, and mentor content uploaded to the platform. We do not collect medical records or protected health information."
  },
  {
    icon: Settings,
    title: "How We Use Data",
    content: "We use data to: deliver platform functionality, provide customer support, maintain product security, and improve system performance. We do not sell personal data to third parties."
  },
  {
    icon: Users,
    title: "Mentor Content",
    content: "Content uploaded by mentors remains private to their accounts and shared only with their end-users. Mentors control what they upload and share. The accuracy and legality of that content is the mentor's responsibility."
  },
  {
    icon: CreditCard,
    title: "Payments",
    content: "Mentor subscriptions are processed through Lemon Squeezy. End-user payments are processed through Stripe directly into the mentor's account. Flow83 does not store credit card data or banking information."
  },
  {
    icon: Shield,
    title: "Security",
    content: "We use industry-standard methods to protect accounts and data. No system can be 100% secure. Users operate at their own risk."
  },
  {
    icon: HeartPulse,
    title: "HIPAA / ICP / Medical Data",
    content: "Flow83 is not HIPAA-compliant or ICP-compliant and does not support the storage or processing of medical files, records, or protected health information. Users and mentors must not upload medical documents."
  },
  {
    icon: UserCheck,
    title: "Data Rights",
    content: "Users may request access, deletion, or correction of their data at any time by contacting support."
  },
  {
    icon: RefreshCw,
    title: "Policy Changes",
    content: "This policy may be updated periodically. Continued platform use means acceptance of the revised version."
  }
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-6 py-16 pt-28">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 text-violet-600 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-testid="text-privacy-title">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-lg">
              Last updated: December 2024
            </p>
          </header>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 md:p-12">
            <div className="space-y-10">
              {privacyContent.map((section, index) => {
                const Icon = section.icon;
                return (
                  <section 
                    key={index} 
                    className="group"
                    data-testid={`privacy-section-${index + 1}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-200">
                        <Icon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                          {index + 1}. {section.title}
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <footer className="mt-16 pt-8 border-t border-gray-200">
              <div className="bg-violet-50 rounded-2xl p-6 border border-violet-200">
                <p className="text-gray-600 text-center">
                  If you have questions about this privacy policy, please contact us at{" "}
                  <a 
                    href="mailto:privacy@flow83.com" 
                    className="text-violet-600 hover:text-violet-700 transition-colors font-medium"
                  >
                    privacy@flow83.com
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { FileText, Shield, Users, Briefcase, CheckCircle, CreditCard, AlertTriangle, Scale, RefreshCw, HeartHandshake } from "lucide-react";

const termsContent = [
  {
    icon: FileText,
    title: "Introduction",
    content: "Flow83 is a SaaS platform that enables mentors to create, publish, and sell personalized journeys, programs, and guided experiences to their clients. By using the platform, you confirm that you have read, understood, and agreed to these Terms."
  },
  {
    icon: HeartHandshake,
    title: "Not a Medical Provider",
    content: "Flow83 is not a medical organization and does not provide medical advice, diagnosis, or treatment. The platform is not a substitute for professional medical care. Always consult a licensed healthcare provider for medical guidance or concerns. Flow83 does not operate under HIPAA/ICP/clinical compliance standards and should not be used for medical records or medical decision-making."
  },
  {
    icon: Users,
    title: "Mentor Responsibility",
    content: "Mentors who upload content, build journeys, and sell programs through Flow83 are solely and fully responsible for the content they provide. Flow83 does not review, edit, evaluate, or guarantee the accuracy, safety, legality, or effectiveness of mentor content. Mentors are responsible for complying with all legal, ethical, and professional standards in their region or field."
  },
  {
    icon: Shield,
    title: "Content Ownership",
    content: "Mentors retain ownership of their intellectual property and grant Flow83 permission to host, display, and deliver the content to end-users. Flow83 does not claim rights to mentor methods, systems, or materials."
  },
  {
    icon: AlertTriangle,
    title: "No Guarantees",
    content: "Flow83 does not guarantee any emotional, mental, physical, energetic, or financial outcomes. All results and experiences are subjective and vary by individual. Use of the platform is entirely at your own risk."
  },
  {
    icon: Briefcase,
    title: "End-User Relationship",
    content: "All financial transactions from end-users purchasing mentor journeys are processed directly through the mentor's Stripe account. Flow83 does not handle or transfer end-user revenue. The mentor is the sole provider of the service purchased by the end-user."
  },
  {
    icon: CreditCard,
    title: "Payments to Flow83",
    content: "Mentors pay Flow83 a recurring subscription fee for platform access. Plans may vary by features, usage limits, and tools such as Stripe integration. Fees are non-refundable unless otherwise stated."
  },
  {
    icon: CheckCircle,
    title: "Platform Use",
    content: "Mentors and users agree not to misuse the system, copy platform features, reverse engineer the product, or upload harmful, illegal, or abusive content. Flow83 may suspend or remove any account that violates these terms."
  },
  {
    icon: Scale,
    title: "Limitation of Liability",
    content: "Flow83 is not liable for: mentor content, user outcomes, business results, emotional, mental, or physical effects, system downtime or data loss. Liability is limited to the subscription fees paid to Flow83."
  },
  {
    icon: RefreshCw,
    title: "Changes to Terms",
    content: "Flow83 may update these terms occasionally. Continued use of the platform signifies agreement to the updated version."
  }
];

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23]">
      <Header />
      <main className="container mx-auto px-6 py-16 pt-28">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-terms-title">
              Terms of Use
            </h1>
            <p className="text-white/50 text-lg">
              Last updated: December 2024
            </p>
          </header>

          <div className="bg-[#1a1a2e]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="space-y-10">
              {termsContent.map((section, index) => {
                const Icon = section.icon;
                return (
                  <section 
                    key={index} 
                    className="group"
                    data-testid={`terms-section-${index + 1}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                        <Icon className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white mb-3">
                          {index + 1}. {section.title}
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <footer className="mt-16 pt-8 border-t border-white/10">
              <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl p-6 border border-violet-500/20">
                <p className="text-white/70 text-center">
                  If you have questions about these terms, please contact us at{" "}
                  <a 
                    href="mailto:support@flow83.com" 
                    className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    support@flow83.com
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

export default TermsOfService;

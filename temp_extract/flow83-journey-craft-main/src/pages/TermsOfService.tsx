import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2024</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing and using Flow 83, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Use License</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Permission is granted to use Flow 83 for creating and sharing transformative journeys under the following conditions:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Content must be original or properly licensed</li>
                <li>No inappropriate, harmful, or illegal content</li>
                <li>Respect intellectual property rights</li>
                <li>Use the platform for legitimate wellness and coaching purposes</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">User Accounts</h2>
            <div className="text-muted-foreground space-y-4">
              <p>When creating an account, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Content Guidelines</h2>
            <div className="text-muted-foreground space-y-4">
              <p>All content shared on Flow 83 must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be respectful and professional</li>
                <li>Not contain harmful, offensive, or inappropriate material</li>
                <li>Respect privacy and confidentiality of participants</li>
                <li>Comply with applicable wellness and coaching standards</li>
                <li>Not make false medical claims or provide unlicensed medical advice</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              You retain ownership of content you create. By using Flow 83, you grant us a license to host, display, and distribute your content as necessary to provide our services. We respect your intellectual property and expect the same respect for others' rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Payment and Subscriptions</h2>
            <div className="text-muted-foreground space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are charged according to your chosen plan</li>
                <li>Payments are processed securely through our payment partners</li>
                <li>Refunds are subject to our refund policy</li>
                <li>You may cancel your subscription at any time</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Disclaimers</h2>
            <div className="text-muted-foreground space-y-4">
              <p>Flow 83 is provided "as is" without warranties of any kind. We specifically disclaim:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fitness for a particular purpose</li>
                <li>Availability or uptime guarantees</li>
                <li>Results from using journeys or content</li>
                <li>Third-party content accuracy</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              Flow 83 shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground">
              For questions regarding these terms, please contact us at{" "}
              <a href="mailto:legal@flow83.com" className="text-primary hover:underline">
                legal@flow83.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
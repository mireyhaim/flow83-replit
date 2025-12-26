import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <Header />
      <main className="container mx-auto px-6 py-16 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight tracking-tight">
              <span className="text-gray-900">Cookie </span>
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">Last updated: January 2024</p>
          </div>
          <div className="prose prose-lg prose-gray">
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies</h2>
            <p className="text-gray-600 mb-4">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
            <div className="text-gray-600 space-y-4">
              <p>Flow 83 uses cookies for several purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you logged in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Improve our platform performance</li>
                <li>Provide personalized content recommendations</li>
                <li>Enable social media integration features</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
            <div className="text-gray-600 space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Essential Cookies</h3>
                <p className="mb-2">These cookies are necessary for the website to function properly:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Authentication and security</li>
                  <li>Session management</li>
                  <li>Load balancing</li>
                  <li>Form submission handling</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Functional Cookies</h3>
                <p className="mb-2">These cookies enhance your experience:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Language preferences</li>
                  <li>Theme settings (dark/light mode)</li>
                  <li>Recently viewed content</li>
                  <li>Customized dashboard layout</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Analytics Cookies</h3>
                <p className="mb-2">These cookies help us understand how you use our platform:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Page views and navigation patterns</li>
                  <li>Feature usage statistics</li>
                  <li>Performance monitoring</li>
                  <li>Error tracking and debugging</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Marketing Cookies</h3>
                <p className="mb-2">These cookies support our marketing efforts:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Targeted advertising</li>
                  <li>Social media integration</li>
                  <li>Campaign performance tracking</li>
                  <li>Conversion measurement</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <div className="text-gray-600 space-y-4">
              <p>We may use third-party services that set their own cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Intercom:</strong> For customer support and communication</li>
                <li><strong>Social Media Platforms:</strong> For sharing and integration features</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
            <div className="text-gray-600 space-y-4">
              <p>You have several options for managing cookies:</p>
              
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Browser Settings</h3>
                <p className="mb-2">Most browsers allow you to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>View and delete existing cookies</li>
                  <li>Block cookies from specific websites</li>
                  <li>Block all cookies (may affect functionality)</li>
                  <li>Receive notifications when cookies are set</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Platform Settings</h3>
                <p>You can manage cookie preferences in your Flow 83 account settings, where you can opt out of non-essential cookies while maintaining core functionality.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Retention</h2>
            <div className="text-gray-600 space-y-4">
              <p>Different cookies have different lifespans:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain for a set period (typically 1-24 months)</li>
                <li><strong>Authentication cookies:</strong> Expire based on your login settings</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this cookie policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:support@flow83.com" className="text-violet-600 hover:underline">
                support@flow83.com
              </a>
            </p>
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;

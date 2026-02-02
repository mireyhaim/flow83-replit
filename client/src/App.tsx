import { Switch, Route, useLocation } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";
import { Loader2 } from "lucide-react";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
      <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
    </div>
  );
}

const LandingPage = lazy(() => import("@/pages/landing"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const MethodPage = lazy(() => import("@/pages/method"));
const JourneysPage = lazy(() => import("@/pages/journeys"));
const JourneyCreatePage = lazy(() => import("@/pages/journey-create"));
const JourneyEditorPage = lazy(() => import("@/pages/journey-editor"));
const JourneySettingsPage = lazy(() => import("@/pages/journey-settings"));
const JourneyPublishPage = lazy(() => import("@/pages/journey-publish"));
const ParticipantView = lazy(() => import("@/pages/participant-view"));
const JourneyLandingPage = lazy(() => import("@/pages/journey-landing"));
const ParticipantJoinPage = lazy(() => import("@/pages/participant-join"));
const AuthCallbackPage = lazy(() => import("@/pages/auth-callback"));
const ShortLinkRedirect = lazy(() => import("@/pages/short-link-redirect"));
const LoginPage = lazy(() => import("@/pages/login"));
const NotFound = lazy(() => import("@/pages/not-found"));

const Pricing = lazy(() => import("@/pages/pricing"));
const ContactUs = lazy(() => import("@/pages/contact"));
const Community = lazy(() => import("@/pages/community"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogArticle = lazy(() => import("@/pages/blog-article"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const HowItWorksPage = lazy(() => import("@/pages/how-it-works"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const NotificationSettingsPage = lazy(() => import("@/pages/notification-settings"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success"));
const ExternalPaymentSuccessPage = lazy(() => import("@/pages/external-payment-success"));
const ExternalPaymentPendingPage = lazy(() => import("@/pages/external-payment-pending"));
const GrowPaymentIframePage = lazy(() => import("@/pages/grow-payment-iframe"));
const SubscriptionSuccessPage = lazy(() => import("@/pages/subscription-success"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const FlowDemoPage = lazy(() => import("@/pages/flow-demo"));
const AdminPage = lazy(() => import("@/pages/admin"));
const PaymentsPage = lazy(() => import("@/pages/payments"));
const SelfBillingTermsPage = lazy(() => import("@/pages/self-billing-terms"));
const ParticipantsPage = lazy(() => import("@/pages/participants"));
const MentorTermsPage = lazy(() => import("@/pages/mentor-terms"));
const SubscriptionActivatePage = lazy(() => import("@/pages/subscription-activate"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/method" component={MethodPage} />
        <Route path="/journeys" component={JourneysPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/payments/self-billing-terms" component={SelfBillingTermsPage} />
        <Route path="/participants" component={ParticipantsPage} />
        <Route path="/feedback" component={FeedbackPage} />
        <Route path="/settings/notifications" component={NotificationSettingsPage} />
        <Route path="/journeys/new" component={JourneyCreatePage} />
        <Route path="/journey/create" component={JourneyCreatePage} />
        <Route path="/journeys/:id/edit" component={JourneyEditorPage} />
        <Route path="/journey/:id/edit" component={JourneyEditorPage} />
        <Route path="/journey/:id/settings" component={JourneySettingsPage} />
        <Route path="/journey/:id/publish" component={JourneyPublishPage} />
        <Route path="/j/:id" component={JourneyLandingPage} />
        <Route path="/join/:journeyId" component={ParticipantJoinPage} />
        <Route path="/auth/callback" component={AuthCallbackPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/f/:code" component={ShortLinkRedirect} />
        <Route path="/p/:token" component={ParticipantView} />
        <Route path="/payment/success" component={PaymentSuccessPage} />
        <Route path="/payment/external-pending" component={ExternalPaymentPendingPage} />
        <Route path="/payment/external-success" component={ExternalPaymentSuccessPage} />
        <Route path="/payment/grow" component={GrowPaymentIframePage} />
        <Route path="/subscription/success" component={SubscriptionSuccessPage} />
        <Route path="/subscription/activate/:token" component={SubscriptionActivatePage} />
              
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/contact" component={ContactUs} />
        <Route path="/community" component={Community} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={BlogArticle} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/mentor-terms" component={MentorTermsPage} />
        <Route path="/flow-demo/:id" component={FlowDemoPage} />
        
        <Route path="/admin/ann83" component={AdminPage} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <Router />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;

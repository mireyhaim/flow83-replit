import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import MethodPage from "@/pages/method";
import JourneysPage from "@/pages/journeys";
import JourneyCreatePage from "@/pages/journey-create";
import JourneyEditorPage from "@/pages/journey-editor";
import JourneySettingsPage from "@/pages/journey-settings";
import ParticipantView from "@/pages/participant-view";
import JourneyLandingPage from "@/pages/journey-landing";
import ParticipantJoinPage from "@/pages/participant-join";
import AuthCallbackPage from "@/pages/auth-callback";
import ShortLinkRedirect from "@/pages/short-link-redirect";
import NotFound from "@/pages/not-found";

// New pages
import Pricing from "@/pages/pricing";
import ContactUs from "@/pages/contact";
import Community from "@/pages/community";
import Blog from "@/pages/blog";
import BlogArticle from "@/pages/blog-article";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import CookiePolicy from "@/pages/cookie-policy";
import ProfilePage from "@/pages/profile";
import NotificationSettingsPage from "@/pages/notification-settings";
import PaymentSuccessPage from "@/pages/payment-success";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/method" component={MethodPage} />
      <Route path="/journeys" component={JourneysPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings/notifications" component={NotificationSettingsPage} />
      <Route path="/journeys/new" component={JourneyCreatePage} />
      <Route path="/journey/create" component={JourneyCreatePage} />
      <Route path="/journeys/:id/edit" component={JourneyEditorPage} />
      <Route path="/journey/:id/edit" component={JourneyEditorPage} />
      <Route path="/journey/:id/settings" component={JourneySettingsPage} />
      <Route path="/j/:id" component={JourneyLandingPage} />
      <Route path="/join/:journeyId" component={ParticipantJoinPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/f/:code" component={ShortLinkRedirect} />
      <Route path="/p/:token" component={ParticipantView} />
      <Route path="/payment/success" component={PaymentSuccessPage} />
      
      {/* New routes */}
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/community" component={Community} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={BlogArticle} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      
      <Route component={NotFound} />
    </Switch>
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

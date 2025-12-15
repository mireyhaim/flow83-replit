import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import MethodPage from "@/pages/method";
import JourneysPage from "@/pages/journeys";
import JourneyCreatePage from "@/pages/journey-create";
import JourneyEditorPage from "@/pages/journey-editor";
import ParticipantView from "@/pages/participant-view";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/method" component={MethodPage} />
      <Route path="/journeys" component={JourneysPage} />
      <Route path="/journeys/new" component={JourneyCreatePage} />
      <Route path="/journeys/:id/edit" component={JourneyEditorPage} />
      <Route path="/journey/:id/edit" component={JourneyEditorPage} />
      <Route path="/p/:token" component={ParticipantView} />
      
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;

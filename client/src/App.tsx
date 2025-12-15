import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import MethodPage from "@/pages/method";
import JourneyCreatePage from "@/pages/journey-create";
import JourneyEditorPage from "@/pages/journey-editor";
import ParticipantView from "@/pages/participant-view";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/method" component={MethodPage} />
      <Route path="/journeys" component={() => <Dashboard />} /> {/* Placeholder redir for now */}
      <Route path="/journeys/new" component={JourneyCreatePage} />
      <Route path="/journey/:id/edit" component={JourneyEditorPage} />
      <Route path="/p/:token" component={ParticipantView} />
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

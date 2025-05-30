import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import NewsFeed from "@/pages/NewsFeed";
import Distribution from "@/pages/Distribution";
import Integrations from "@/pages/Integrations";
import DataSources from "@/pages/DataSources";
import Settings from "@/pages/Settings";
import MainLayout from "@/layouts/MainLayout";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import DiscordIntegrationsPage from "@/pages/DiscordIntegrations";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/news-feed" component={NewsFeed} />
      <Route path="/distribution" component={Distribution} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/data-sources" component={DataSources} />
      <Route path="/settings" component={Settings} />
      <Route path="/discord-integrations" component={DiscordIntegrationsPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <IntegrationProvider>
          <MainLayout>
            <Router />
          </MainLayout>
          <Toaster />
        </IntegrationProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;

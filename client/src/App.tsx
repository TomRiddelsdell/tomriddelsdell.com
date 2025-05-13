import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Career from "@/pages/Career";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import AppConnections from "@/pages/AppConnections";
import Templates from "@/pages/Templates";
import ActivityLog from "@/pages/ActivityLog";
import Account from "@/pages/Account";
import Security from "@/pages/Security";
import { ThemeProvider } from "@/components/ui/theme-provider";

function Router() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/career" component={Career} />
        <Route path="/projects" component={Projects} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/workflows" component={Workflows} />
        <Route path="/app-connections" component={AppConnections} />
        <Route path="/templates" component={Templates} />
        <Route path="/activity-log" component={ActivityLog} />
        <Route path="/account" component={Account} />
        <Route path="/security" component={Security} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="flowcreate-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

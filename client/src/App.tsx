import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
        {/* Public route - accessible to everyone */}
        <Route path="/" component={Home} />
        
        {/* Protected routes - authenticated users only */}
        <Route path="/career">
          {() => <ProtectedRoute component={Career} />}
        </Route>
        <Route path="/projects">
          {() => <ProtectedRoute component={Projects} />}
        </Route>
        <Route path="/tasks">
          {() => <ProtectedRoute component={Tasks} />}
        </Route>
        
        {/* Admin routes - require admin permissions */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} allowedRoles={['admin']} />}
        </Route>
        <Route path="/workflows">
          {() => <ProtectedRoute component={Workflows} />}
        </Route>
        <Route path="/app-connections">
          {() => <ProtectedRoute component={AppConnections} />}
        </Route>
        <Route path="/templates">
          {() => <ProtectedRoute component={Templates} />}
        </Route>
        <Route path="/activity-log">
          {() => <ProtectedRoute component={ActivityLog} allowedRoles={['admin']} />}
        </Route>
        
        {/* User account routes - authenticated users */}
        <Route path="/account">
          {() => <ProtectedRoute component={Account} />}
        </Route>
        <Route path="/security">
          {() => <ProtectedRoute component={Security} />}
        </Route>
        
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

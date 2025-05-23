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
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { ThemeProvider } from "@/components/ui/theme-provider";

function Router() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Switch>
        {/* Public route - accessible to everyone */}
        <Route path="/" component={Home} />
        
        {/* Password reset route - public */}
        <Route path="/reset-password" component={ResetPasswordPage} />
        
        {/* Protected routes - authenticated users only */}
        <Route path="/career">
          {() => (
            <ProtectedRoute>
              <Career />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/projects">
          {() => (
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/tasks">
          {() => (
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          )}
        </Route>
        
        {/* Admin routes */}
        <Route path="/dashboard">
          <Dashboard />
        </Route>
        <Route path="/workflows">
          <Workflows />
        </Route>
        <Route path="/app-connections">
          <AppConnections />
        </Route>
        <Route path="/templates">
          <Templates />
        </Route>
        <Route path="/activity-log">
          <ActivityLog />
        </Route>
        
        {/* User account routes */}
        <Route path="/account">
          <Account />
        </Route>
        <Route path="/security">
          <Security />
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

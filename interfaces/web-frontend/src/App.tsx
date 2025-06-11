import React from 'react'

import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";

// Import pages
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import WorkflowCreate from "@/pages/WorkflowCreate";
import Templates from "@/pages/Templates";
import AppConnections from "@/pages/AppConnections";
import ActivityLog from "@/pages/ActivityLog";
import Account from "@/pages/Account";
import Security from "@/pages/Security";
import UserManagement from "@/pages/UserManagement";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";
import Career from "@/pages/Career";
import AuthCallback from "@/pages/AuthCallback";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import MonitoringDashboard from "../../../client/src/pages/MonitoringDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Switch>
                {/* Public routes */}
                <Route path="/" component={Home} />
                <Route path="/auth/callback" component={AuthCallback} />
                <Route path="/reset-password" component={ResetPasswordPage} />
                
                {/* Protected routes with sidebar layout */}
                <Route path="/dashboard">
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/workflows">
                  <ProtectedRoute>
                    <AppLayout>
                      <Workflows />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/workflows/create">
                  <ProtectedRoute>
                    <AppLayout>
                      <WorkflowCreate />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/templates">
                  <ProtectedRoute>
                    <AppLayout>
                      <Templates />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/app-connections">
                  <ProtectedRoute>
                    <AppLayout>
                      <AppConnections />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/activity-log">
                  <ProtectedRoute>
                    <AppLayout>
                      <ActivityLog />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/account">
                  <ProtectedRoute>
                    <AppLayout>
                      <Account />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/security">
                  <ProtectedRoute>
                    <AppLayout>
                      <Security />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/projects">
                  <ProtectedRoute>
                    <AppLayout>
                      <Projects />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/tasks">
                  <ProtectedRoute>
                    <AppLayout>
                      <Tasks />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/career">
                  <ProtectedRoute>
                    <AppLayout>
                      <Career />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/user-management">
                  <ProtectedRoute>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                <Route path="/monitoring">
                  <ProtectedRoute>
                    <AppLayout>
                      <MonitoringDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                </Route>
                
                {/* 404 route */}
                <Route component={NotFound} />
              </Switch>
            </div>
            <Toaster />
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default App
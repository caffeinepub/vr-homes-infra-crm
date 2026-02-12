import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useLogoutAgent } from './hooks/useQueries';
import { useStartupGuards } from './hooks/useStartupGuards';
import { useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthPage from './pages/AuthPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import StartupGate from './components/StartupGate';
import { Toaster } from './components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Lazy load dashboard components to reduce initial bundle size
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const logoutAgent = useLogoutAgent();
  const queryClient = useQueryClient();
  
  const isAuthenticated = !!identity;
  
  // Only enable startup guards when authenticated
  const startupGuards = useStartupGuards({ enabled: isAuthenticated });

  const showProfileSetup =
    isAuthenticated && !startupGuards.isLoading && startupGuards.isFetched && startupGuards.userProfile === null;

  // Logout agent and clear cache when user logs out
  useEffect(() => {
    const handleLogout = async () => {
      if (!isAuthenticated && !isInitializing) {
        try {
          await logoutAgent.mutateAsync();
        } catch (error) {
          // Ignore errors during logout
        }
        // Clear all cached data on logout
        queryClient.clear();
      }
    };
    handleLogout();
  }, [isAuthenticated, isInitializing]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <AuthPage />
        ) : (
          <StartupGate
            isLoading={startupGuards.isLoading}
            isError={startupGuards.isError}
            error={startupGuards.error}
            onRetry={startupGuards.retry}
          >
            {showProfileSetup ? (
              <ProfileSetupModal />
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading dashboard...</span>
                  </div>
                }
              >
                {startupGuards.isAdmin ? <AdminDashboard /> : <AgentDashboard />}
              </Suspense>
            )}
          </StartupGate>
        )}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

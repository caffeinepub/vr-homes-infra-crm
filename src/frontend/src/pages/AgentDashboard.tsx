import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsCallerApproved, useGetAgentProfileByCaller } from '../hooks/useQueries';
import { useStartupGuards } from '../hooks/useStartupGuards';
import { CheckCircle, UsersRound, Target, Calendar, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import LoginForm from '../components/LoginForm';

// Lazy load tab panel components to reduce initial load
const AgentCustomersList = lazy(() => import('../components/AgentCustomersList'));
const AgentLeadsList = lazy(() => import('../components/AgentLeadsList'));
const AgentFollowUpsList = lazy(() => import('../components/AgentFollowUpsList'));
const AgentWhatsAppPanel = lazy(() => import('../components/AgentWhatsAppPanel'));

// Lightweight loading fallback for tab content
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading...</span>
    </div>
  );
}

export default function AgentDashboard() {
  const startupGuards = useStartupGuards();
  const approvalQuery = useIsCallerApproved();
  const agentProfileQuery = useGetAgentProfileByCaller();
  const [activeTab, setActiveTab] = useState<'profile' | 'customers' | 'leads' | 'followups' | 'whatsapp'>('profile');

  const userProfile = startupGuards.userProfile;
  const isApproved = approvalQuery.data;
  const agentProfile = agentProfileQuery.data;

  // Compact loading state for approval/profile checks
  if (approvalQuery.isLoading || agentProfileQuery.isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Checking agent status...</span>
        </div>
      </div>
    );
  }

  // Compact error state with retry
  if (approvalQuery.isError || agentProfileQuery.isError) {
    const error = approvalQuery.error || agentProfileQuery.error;
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Unable to Load Dashboard</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{(error as Error)?.message || 'An error occurred while loading your dashboard. Please try again.'}</p>
            <Button
              onClick={() => {
                approvalQuery.refetch();
                agentProfileQuery.refetch();
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If not approved, show pending message
  if (!isApproved) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">Approval Pending</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Your agent registration is pending admin approval. You will be able to access the dashboard once approved.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If approved but not logged in (no agent profile), show login form
  if (!agentProfile) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Agent Login Required</CardTitle>
            <CardDescription>Please complete face verification to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agent is approved and logged in - show full dashboard
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {userProfile?.name || 'Agent'}!
        </h1>
        <p className="text-lg text-muted-foreground">Your agent dashboard</p>
      </div>

      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Agent Console</CardTitle>
          <CardDescription>Manage your profile, customers, leads, and follow-ups</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <UsersRound className="w-4 h-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="followups" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Follow-Ups
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-lg font-semibold">{userProfile?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <p className="text-lg font-semibold">{userProfile?.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg font-semibold">{userProfile?.email}</p>
                  </div>
                </div>

                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-200">Account Active</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Your agent account has been approved and is active.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="customers">
              <Suspense fallback={<TabLoadingFallback />}>
                <AgentCustomersList />
              </Suspense>
            </TabsContent>

            <TabsContent value="leads">
              <Suspense fallback={<TabLoadingFallback />}>
                <AgentLeadsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="followups">
              <Suspense fallback={<TabLoadingFallback />}>
                <AgentFollowUpsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="whatsapp">
              <Suspense fallback={<TabLoadingFallback />}>
                <AgentWhatsAppPanel />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

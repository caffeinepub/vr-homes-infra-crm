import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserCheck,
  UsersRound,
  Target,
  Calendar,
  MessageCircle,
  FileText,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';

// Lazy load tab panel components to reduce initial load
const AdminOverviewPanel = lazy(() => import('../components/AdminOverviewPanel'));
const PendingAgentsList = lazy(() => import('../components/PendingAgentsList'));
const ApprovedAgentsList = lazy(() => import('../components/ApprovedAgentsList'));
const AdminCustomersList = lazy(() => import('../components/AdminCustomersList'));
const AdminLeadsList = lazy(() => import('../components/AdminLeadsList'));
const AdminFollowUpsList = lazy(() => import('../components/AdminFollowUpsList'));
const AdminWhatsAppPanel = lazy(() => import('../components/AdminWhatsAppPanel'));
const AdminInvoicePanel = lazy(() => import('../components/AdminInvoicePanel'));

// Lightweight loading fallback for tab content
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pending' | 'approved' | 'customers' | 'leads' | 'followups' | 'whatsapp' | 'invoices'
  >('overview');

  // Function to programmatically switch tabs (called from overview panel)
  const switchToTab = (
    tab: 'overview' | 'pending' | 'approved' | 'customers' | 'leads' | 'followups' | 'whatsapp' | 'invoices'
  ) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">Manage agents, customers, leads, and follow-ups</p>
      </div>

      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Console</CardTitle>
          <CardDescription>Complete control over your VR Homes operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-8 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Agents
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
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminOverviewPanel onNavigate={switchToTab} />
              </Suspense>
            </TabsContent>

            <TabsContent value="pending">
              <Suspense fallback={<TabLoadingFallback />}>
                <PendingAgentsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="approved">
              <Suspense fallback={<TabLoadingFallback />}>
                <ApprovedAgentsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="customers">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminCustomersList />
              </Suspense>
            </TabsContent>

            <TabsContent value="leads">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminLeadsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="followups">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminFollowUpsList />
              </Suspense>
            </TabsContent>

            <TabsContent value="whatsapp">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminWhatsAppPanel />
              </Suspense>
            </TabsContent>

            <TabsContent value="invoices">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminInvoicePanel />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import { useGetAllAgentProfiles, useGetAgentLoginTimesAndStatus } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, User, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMemo } from 'react';
import { isApproved } from '../utils/approvalStatus';
import { arrayToCSV, downloadCSV, generateReportFilename } from '../utils/csv';
import { toast } from 'sonner';

export default function ApprovedAgentsList() {
  const { data: allAgents, isLoading: agentsLoading } = useGetAllAgentProfiles();
  const { data: loginData, isLoading: loginLoading } = useGetAgentLoginTimesAndStatus();

  const approvedAgents = useMemo(() => {
    if (!allAgents || !Array.isArray(allAgents)) return [];
    return allAgents.filter(agent => isApproved(agent.status));
  }, [allAgents]);

  // Create a map of mobile to login info
  const loginInfoMap = useMemo(() => {
    const map = new Map<string, { lastLogin: bigint; isActive: boolean }>();
    if (loginData) {
      loginData.forEach(([mobile, time, isActive]) => {
        map.set(mobile, { lastLogin: time, isActive });
      });
    }
    return map;
  }, [loginData]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  const handleExportCSV = () => {
    if (approvedAgents.length === 0) {
      toast.error('No agents to export');
      return;
    }

    // Prepare data for CSV export
    const exportData = approvedAgents.map(agent => {
      const loginInfo = loginInfoMap.get(agent.mobile);
      return {
        name: agent.name,
        mobile: agent.mobile,
        email: agent.email,
        approvalStatus: 'Approved',
        lastLogin: loginInfo?.lastLogin ? formatTimestamp(loginInfo.lastLogin) : 'Never',
        status: loginInfo?.isActive ? 'Active' : 'Inactive',
      };
    });

    const headers = [
      { key: 'name' as const, label: 'Name' },
      { key: 'mobile' as const, label: 'Mobile' },
      { key: 'email' as const, label: 'Email' },
      { key: 'approvalStatus' as const, label: 'Approval Status' },
      { key: 'lastLogin' as const, label: 'Last Login' },
      { key: 'status' as const, label: 'Status' },
    ];

    const csvContent = arrayToCSV(exportData, headers);
    const filename = generateReportFilename('agents-report');
    downloadCSV(csvContent, filename);
    toast.success('Agents report exported successfully');
  };

  if (agentsLoading || loginLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (approvedAgents.length === 0) {
    return (
      <Alert>
        <UserCheck className="h-4 w-4" />
        <AlertDescription>No approved agents yet. Approve pending registrations to see them here.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Agents CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Face</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvedAgents.map((agent) => {
              const loginInfo = loginInfoMap.get(agent.mobile);
              // Cast to Uint8Array to ensure proper type for Blob
              const faceImageUrl = agent.faceEmbeddings.length > 0
                ? URL.createObjectURL(new Blob([new Uint8Array(agent.faceEmbeddings)], { type: 'image/jpeg' }))
                : null;

              return (
                <TableRow key={agent.mobile}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {faceImageUrl ? (
                        <img
                          src={faceImageUrl}
                          alt={agent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.mobile}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {loginInfo?.lastLogin ? formatTimestamp(loginInfo.lastLogin) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={loginInfo?.isActive ? 'default' : 'secondary'}>
                        {loginInfo?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {loginInfo?.isActive && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useGetAllLeads, useGetAllAgentProfiles, useIsAdmin } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, AlertTriangle, Phone, Plus, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadStatus, LeadRequirement, ApprovalStatus } from '../backend';
import type { Lead } from '../types';
import AdminAddLeadDialog from './AdminAddLeadDialog';
import { arrayToCSV, downloadCSV, generateReportFilename } from '../utils/csv';
import { toast } from 'sonner';

interface AdminLeadsListProps {
  statusFilter?: LeadStatus | 'all';
  onStatusFilterChange?: (status: LeadStatus | 'all') => void;
}

export default function AdminLeadsList({ statusFilter = 'all', onStatusFilterChange }: AdminLeadsListProps) {
  const { data: leads, isLoading } = useGetAllLeads();
  const { data: allAgents } = useGetAllAgentProfiles();
  const { data: isAdmin } = useIsAdmin();
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [localStatusFilter, setLocalStatusFilter] = useState<LeadStatus | 'all'>(statusFilter);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Sync local filter with prop
  useEffect(() => {
    setLocalStatusFilter(statusFilter);
  }, [statusFilter]);

  const handleStatusFilterChange = (newStatus: LeadStatus | 'all') => {
    setLocalStatusFilter(newStatus);
    onStatusFilterChange?.(newStatus);
  };

  const approvedAgents = allAgents?.filter(agent => agent.status === ApprovalStatus.approved) || [];

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is VR Homes Infra CRM.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.new_: return 'New';
      case LeadStatus.converted: return 'Converted';
      case LeadStatus.lost: return 'Lost';
      case LeadStatus.going_on: return 'Going On';
      default: return status;
    }
  };

  const getRequirementLabel = (req: LeadRequirement) => {
    switch (req) {
      case LeadRequirement.RWA_flat: return 'RWA Flat';
      case LeadRequirement.Semi_furnished_flat: return 'Semi-furnished Flat';
      case LeadRequirement.Fully_furnished_flat: return 'Fully-furnished Flat';
      default: return req;
    }
  };

  // Check if lead is overdue (8 hours = 28800000 milliseconds)
  const isOverdue = (lead: Lead) => {
    if (!lead.remarks || lead.remarks.trim() === '') {
      const now = Date.now();
      const createdTime = Number(lead.createdAt) / 1000000; // Convert nanoseconds to milliseconds
      const eightHours = 8 * 60 * 60 * 1000;
      return (now - createdTime) > eightHours;
    }
    return false;
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  let filteredLeads = leads || [];
  
  // Apply agent filter
  if (filterAgent !== 'all') {
    filteredLeads = filteredLeads.filter(l => l.assignedAgent === filterAgent);
  }
  
  // Apply status filter
  if (localStatusFilter !== 'all') {
    filteredLeads = filteredLeads.filter(l => l.status === localStatusFilter);
  }

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    // Prepare data for CSV export
    const exportData = filteredLeads.map(lead => {
      const agent = approvedAgents.find(a => a.mobile === lead.assignedAgent);
      return {
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email || '',
        status: getStatusLabel(lead.status),
        requirement: getRequirementLabel(lead.requirement),
        description: lead.description,
        assignedAgentMobile: lead.assignedAgent,
        assignedAgentName: agent?.name || '',
        remarks: lead.remarks || '',
        createdAt: formatTimestamp(lead.createdAt),
      };
    });

    const headers = [
      { key: 'name' as const, label: 'Lead Name' },
      { key: 'mobile' as const, label: 'Mobile' },
      { key: 'email' as const, label: 'Email' },
      { key: 'status' as const, label: 'Status' },
      { key: 'requirement' as const, label: 'Requirement' },
      { key: 'description' as const, label: 'Description' },
      { key: 'assignedAgentMobile' as const, label: 'Assigned Agent Mobile' },
      { key: 'assignedAgentName' as const, label: 'Assigned Agent Name' },
      { key: 'remarks' as const, label: 'Remarks' },
      { key: 'createdAt' as const, label: 'Created At' },
    ];

    const csvContent = arrayToCSV(exportData, headers);
    const filename = generateReportFilename('leads-report');
    downloadCSV(csvContent, filename);
    toast.success('Leads report exported successfully');
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        )}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>No leads found. Click "Add Lead" to create one.</AlertDescription>
        </Alert>
        <AdminAddLeadDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Agent:</label>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {approvedAgents.map((agent) => (
                  <SelectItem key={agent.mobile} value={agent.mobile}>
                    {agent.name} ({agent.mobile})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select value={localStatusFilter} onValueChange={(value) => handleStatusFilterChange(value as LeadStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={LeadStatus.new_}>New</SelectItem>
                <SelectItem value={LeadStatus.going_on}>Going On</SelectItem>
                <SelectItem value={LeadStatus.converted}>Converted</SelectItem>
                <SelectItem value={LeadStatus.lost}>Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Leads CSV
          </Button>
          {isAdmin && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No leads found for selected filters
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead, index) => {
                const agent = approvedAgents.find(a => a.mobile === lead.assignedAgent);
                const overdue = isOverdue(lead);
                return (
                  <TableRow key={`${lead.mobile}-${index}`} className={overdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.mobile}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getStatusLabel(lead.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getRequirementLabel(lead.requirement)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{lead.description}</TableCell>
                    <TableCell>{agent?.name || lead.assignedAgent}</TableCell>
                    <TableCell className="max-w-xs">
                      {lead.remarks ? (
                        <span className="text-sm">{lead.remarks}</span>
                      ) : overdue ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">No remarks</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsApp(lead.mobile, lead.name)}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCall(lead.mobile)}
                          title="Make phone call"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AdminAddLeadDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}

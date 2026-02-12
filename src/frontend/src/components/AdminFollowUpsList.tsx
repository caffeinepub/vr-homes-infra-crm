import { useState } from 'react';
import { useGetAllFollowUps, useGetApprovedAgents, useGetAllCustomers, useGetAllLeads } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, AlertTriangle, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FollowUp } from '../types';

export default function AdminFollowUpsList() {
  const { data: followUps, isLoading } = useGetAllFollowUps();
  const { data: agents } = useGetApprovedAgents();
  const { data: customers } = useGetAllCustomers();
  const { data: leads } = useGetAllLeads();

  const [filterAgent, setFilterAgent] = useState<string>('all');

  const filteredFollowUps = filterAgent === 'all' 
    ? followUps || []
    : (followUps || []).filter(f => f.agent === filterAgent);

  const isOverdue = (followUp: FollowUp) => {
    if (followUp.status === 'completed') return false;
    const now = Date.now();
    const followUpTime = Number(followUp.followUpTime) / 1000000; // Convert nanoseconds to milliseconds
    return now > followUpTime;
  };

  const getLinkedName = (followUp: FollowUp) => {
    if (followUp.type === 'customer') {
      const customer = customers?.find(c => c.mobile === followUp.linkedId);
      return customer?.name || followUp.linkedId;
    } else {
      const lead = leads?.find(l => l.mobile === followUp.linkedId);
      return lead?.name || followUp.linkedId;
    }
  };

  const getLinkedMobile = (followUp: FollowUp) => {
    return followUp.linkedId;
  };

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is VR Homes Infra CRM.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!followUps || followUps.length === 0) {
    return (
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>No follow-ups found. Agents can add follow-ups from their dashboard.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Agent:</label>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents?.map((agent) => {
              const principalStr = agent.principal.toString();
              return (
                <SelectItem key={principalStr} value={principalStr}>
                  {principalStr.slice(0, 10)}...
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Follow-up Date/Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer/Lead</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFollowUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No follow-ups found for selected filter
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowUps.map((followUp) => {
                const overdue = isOverdue(followUp);
                const followUpDate = new Date(Number(followUp.followUpTime) / 1000000);
                const linkedName = getLinkedName(followUp);
                const linkedMobile = getLinkedMobile(followUp);
                
                return (
                  <TableRow key={followUp.id} className={overdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-medium">
                      {followUpDate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{followUp.type}</Badge>
                    </TableCell>
                    <TableCell>{linkedName}</TableCell>
                    <TableCell className="font-mono text-xs">{followUp.agent.slice(0, 10)}...</TableCell>
                    <TableCell className="max-w-xs truncate">{followUp.remarks}</TableCell>
                    <TableCell>
                      {overdue ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </Badge>
                      ) : followUp.status === 'completed' ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsApp(linkedMobile, linkedName)}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCall(linkedMobile)}
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
    </div>
  );
}

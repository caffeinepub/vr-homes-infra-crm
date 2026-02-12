import { useState } from 'react';
import { useGetAllCustomers, useGetAllAgentProfiles, useIsAdmin } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Phone, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Requirement, ApprovalStatus } from '../backend';
import AdminAddCustomerDialog from './AdminAddCustomerDialog';

export default function AdminCustomersList() {
  const { data: customers, isLoading } = useGetAllCustomers();
  const { data: allAgents } = useGetAllAgentProfiles();
  const { data: isAdmin } = useIsAdmin();
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const approvedAgents = allAgents?.filter(agent => agent.status === ApprovalStatus.approved) || [];

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is VR Homes Infra CRM.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const getRequirementLabel = (req: Requirement) => {
    switch (req) {
      case Requirement.Rent: return 'Rent';
      case Requirement.Sell: return 'Sell';
      case Requirement.Purchase: return 'Purchase';
      case Requirement.Interior: return 'Interior';
      case Requirement.RWA_flat: return 'RWA Flat';
      case Requirement.Semi_furnished_flat: return 'Semi-furnished Flat';
      case Requirement.Fully_furnished_flat: return 'Fully-furnished Flat';
      default: return req;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredCustomers = filterAgent === 'all' 
    ? customers || []
    : (customers || []).filter(c => c.assignedAgent === filterAgent);

  if (!customers || customers.length === 0) {
    return (
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        )}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>No customers found. Click "Add Customer" to create one.</AlertDescription>
        </Alert>
        <AdminAddCustomerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Agent:</label>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[250px]">
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
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No customers found for selected filter
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer, index) => {
                const agent = approvedAgents.find(a => a.mobile === customer.assignedAgent);
                return (
                  <TableRow key={`${customer.mobile}-${index}`}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRequirementLabel(customer.requirement)}</Badge>
                    </TableCell>
                    <TableCell>{agent?.name || customer.assignedAgent}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsApp(customer.mobile, customer.name)}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCall(customer.mobile)}
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

      <AdminAddCustomerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}

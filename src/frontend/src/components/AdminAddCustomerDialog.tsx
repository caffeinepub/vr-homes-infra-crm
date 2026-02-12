import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAddCustomer, useGetAllAgentProfiles } from '../hooks/useQueries';
import { Requirement, ApprovalStatus } from '../backend';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminAddCustomerDialog({ open, onOpenChange }: AdminAddCustomerDialogProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [requirement, setRequirement] = useState<Requirement | ''>('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('pending');

  const addCustomer = useAddCustomer();
  const { data: allAgents } = useGetAllAgentProfiles();

  const approvedAgents = allAgents?.filter(agent => agent.status === ApprovalStatus.approved) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!requirement) {
      toast.error('Requirement is required');
      return;
    }
    if (!assignedAgent) {
      toast.error('Assigned agent is required');
      return;
    }
    if (!followUpStatus) {
      toast.error('Follow-up status is required');
      return;
    }

    try {
      await addCustomer.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        requirement,
        assignedAgent,
        followUpStatus,
      });

      // Reset form
      setName('');
      setMobile('');
      setEmail('');
      setRequirement('');
      setAssignedAgent('');
      setFollowUpStatus('pending');
      onOpenChange(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="requirement">Requirement *</Label>
            <Select value={requirement} onValueChange={(val) => setRequirement(val as Requirement)}>
              <SelectTrigger id="requirement">
                <SelectValue placeholder="Select requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Requirement.RWA_flat}>RWA Flat</SelectItem>
                <SelectItem value={Requirement.Semi_furnished_flat}>Semi-furnished Flat</SelectItem>
                <SelectItem value={Requirement.Fully_furnished_flat}>Fully-furnished Flat</SelectItem>
                <SelectItem value={Requirement.Rent}>Rent</SelectItem>
                <SelectItem value={Requirement.Sell}>Sell</SelectItem>
                <SelectItem value={Requirement.Purchase}>Purchase</SelectItem>
                <SelectItem value={Requirement.Interior}>Interior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignedAgent">Assigned Agent *</Label>
            <Select value={assignedAgent} onValueChange={setAssignedAgent}>
              <SelectTrigger id="assignedAgent">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {approvedAgents.map((agent) => (
                  <SelectItem key={agent.mobile} value={agent.mobile}>
                    {agent.name} ({agent.mobile})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="followUpStatus">Follow-up Status *</Label>
            <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
              <SelectTrigger id="followUpStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCustomer.isPending}>
              {addCustomer.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

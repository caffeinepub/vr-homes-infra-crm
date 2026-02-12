import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAddLead, useGetAllAgentProfiles } from '../hooks/useQueries';
import { LeadRequirement, LeadStatus, ApprovalStatus } from '../backend';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminAddLeadDialog({ open, onOpenChange }: AdminAddLeadDialogProps) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LeadStatus | ''>(LeadStatus.new_);
  const [requirement, setRequirement] = useState<LeadRequirement | ''>('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');

  const addLead = useAddLead();
  const { data: allAgents } = useGetAllAgentProfiles();

  const approvedAgents = allAgents?.filter(agent => agent.status === ApprovalStatus.approved) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Lead name is required');
      return;
    }
    if (!mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!status) {
      toast.error('Status is required');
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
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      await addLead.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        status,
        requirement,
        assignedAgent,
        description: description.trim(),
        remarks: remarks.trim() || undefined,
      });

      // Reset form
      setName('');
      setMobile('');
      setEmail('');
      setStatus(LeadStatus.new_);
      setRequirement('');
      setAssignedAgent('');
      setDescription('');
      setRemarks('');
      onOpenChange(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Lead Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter lead name"
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
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as LeadStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeadStatus.new_}>New</SelectItem>
                <SelectItem value={LeadStatus.going_on}>Going On</SelectItem>
                <SelectItem value={LeadStatus.converted}>Converted</SelectItem>
                <SelectItem value={LeadStatus.lost}>Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="requirement">Requirement *</Label>
            <Select value={requirement} onValueChange={(val) => setRequirement(val as LeadRequirement)}>
              <SelectTrigger id="requirement">
                <SelectValue placeholder="Select requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeadRequirement.RWA_flat}>RWA Flat</SelectItem>
                <SelectItem value={LeadRequirement.Semi_furnished_flat}>Semi-furnished Flat</SelectItem>
                <SelectItem value={LeadRequirement.Fully_furnished_flat}>Fully-furnished Flat</SelectItem>
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lead description"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addLead.isPending}>
              {addLead.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

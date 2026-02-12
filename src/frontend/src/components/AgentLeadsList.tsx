import { useState } from 'react';
import { useGetCallerUserProfile, useGetLeadsByAgent, useAddLead } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Target, AlertTriangle, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadStatus, LeadRequirement } from '../backend';
import type { Lead } from '../types';

export default function AgentLeadsList() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: leads, isLoading } = useGetLeadsByAgent(userProfile?.mobile || '');
  const addLead = useAddLead();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    status: LeadStatus.new_,
    requirement: LeadRequirement.RWA_flat,
    description: '',
    remarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.mobile) return;

    await addLead.mutateAsync({
      ...formData,
      email: formData.email || undefined,
      remarks: formData.remarks || undefined,
      assignedAgent: userProfile.mobile,
    });

    setFormData({ 
      name: '', 
      mobile: '', 
      email: '',
      status: LeadStatus.new_,
      requirement: LeadRequirement.RWA_flat,
      description: '',
      remarks: '' 
    });
    setIsAddDialogOpen(false);
  };

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is ${userProfile?.name} from VR Homes Infra.`);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Leads</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Enter lead details. Remember to add remarks within 8 hours.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lead Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value as LeadStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeadStatus.new_}>New</SelectItem>
                      <SelectItem value={LeadStatus.converted}>Converted</SelectItem>
                      <SelectItem value={LeadStatus.lost}>Lost</SelectItem>
                      <SelectItem value={LeadStatus.going_on}>Going On</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement">Requirement *</Label>
                  <Select 
                    value={formData.requirement} 
                    onValueChange={(value) => setFormData({ ...formData, requirement: value as LeadRequirement })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeadRequirement.RWA_flat}>RWA Flat</SelectItem>
                      <SelectItem value={LeadRequirement.Semi_furnished_flat}>Semi-furnished Flat</SelectItem>
                      <SelectItem value={LeadRequirement.Fully_furnished_flat}>Fully-furnished Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Initial Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                    placeholder="Add initial remarks"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
      </div>

      {!leads || leads.length === 0 ? (
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>No leads yet. Click "Add Lead" to get started.</AlertDescription>
        </Alert>
      ) : (
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
                <TableHead>Remarks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, index) => {
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
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

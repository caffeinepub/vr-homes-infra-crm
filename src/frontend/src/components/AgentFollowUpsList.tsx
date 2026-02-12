import { useState } from 'react';
import { useGetCallerUserProfile, useGetFollowUpsByAgent, useGetCustomersByAgent, useGetLeadsByAgent, useAddFollowUp } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Calendar, AlertTriangle, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FollowUp } from '../types';

export default function AgentFollowUpsList() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: followUps, isLoading } = useGetFollowUpsByAgent(userProfile?.mobile || '');
  const { data: customers } = useGetCustomersByAgent(userProfile?.mobile || '');
  const { data: leads } = useGetLeadsByAgent(userProfile?.mobile || '');
  const addFollowUp = useAddFollowUp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'customer',
    linkedId: '',
    followUpTime: '',
    remarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.mobile) return;

    const followUpTime = BigInt(new Date(formData.followUpTime).getTime() * 1000000); // Convert to nanoseconds

    await addFollowUp.mutateAsync({
      linkedId: formData.linkedId,
      type: formData.type,
      agent: userProfile.mobile,
      followUpTime,
      remarks: formData.remarks,
      status: 'pending',
    });

    setFormData({ type: 'customer', linkedId: '', followUpTime: '', remarks: '' });
    setIsDialogOpen(false);
  };

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
    const message = encodeURIComponent(`Hello ${name}, this is ${userProfile?.name} from VR Homes Infra.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const availableItems = formData.type === 'customer' ? customers : leads;

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
        <h3 className="text-lg font-semibold">My Follow-Ups</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Follow-Up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Follow-Up</DialogTitle>
              <DialogDescription>Schedule a follow-up for your customer or lead.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, linkedId: '' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedId">Select {formData.type === 'customer' ? 'Customer' : 'Lead'}</Label>
                  <Select value={formData.linkedId} onValueChange={(value) => setFormData({ ...formData, linkedId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${formData.type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems?.map((item) => (
                        <SelectItem key={item.mobile} value={item.mobile}>
                          {item.name} ({item.mobile})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpTime">Follow-up Date & Time</Label>
                  <Input
                    id="followUpTime"
                    type="datetime-local"
                    value={formData.followUpTime}
                    onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addFollowUp.isPending}>
                  {addFollowUp.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Follow-Up'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!followUps || followUps.length === 0 ? (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>No follow-ups yet. Click "Add Follow-Up" to get started.</AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Follow-up Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer/Lead</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((followUp) => {
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
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useGetCallerUserProfile, useGetCustomersByAgent, useAddCustomer } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Requirement } from '../backend';

export default function AgentCustomersList() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: customers, isLoading } = useGetCustomersByAgent(userProfile?.mobile || '');
  const addCustomer = useAddCustomer();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    requirement: Requirement.Rent,
    description: '',
    followUpStatus: 'Pending',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.mobile) return;

    await addCustomer.mutateAsync({
      ...formData,
      email: formData.email || undefined,
      assignedAgent: userProfile.mobile,
    });

    setFormData({ 
      name: '', 
      mobile: '', 
      email: '', 
      requirement: Requirement.Rent, 
      description: '',
      followUpStatus: 'Pending' 
    });
    setIsDialogOpen(false);
  };

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is ${userProfile?.name} from VR Homes Infra.`);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Customers</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Enter customer details to add them to your list.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
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
                  <Label htmlFor="requirement">Requirement *</Label>
                  <Select 
                    value={formData.requirement} 
                    onValueChange={(value) => setFormData({ ...formData, requirement: value as Requirement })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Requirement.Rent}>Rent</SelectItem>
                      <SelectItem value={Requirement.Sell}>Sell</SelectItem>
                      <SelectItem value={Requirement.Purchase}>Purchase</SelectItem>
                      <SelectItem value={Requirement.Interior}>Interior</SelectItem>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
      </div>

      {!customers || customers.length === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>No customers yet. Click "Add Customer" to get started.</AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={`${customer.mobile}-${index}`}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.mobile}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getRequirementLabel(customer.requirement)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{customer.followUpStatus}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

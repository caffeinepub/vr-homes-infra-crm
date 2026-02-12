import { useState } from 'react';
import { useGetAllCustomers, useGetAllLeads } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, FileText, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function AdminInvoicePanel() {
  const { data: customers, isLoading: customersLoading } = useGetAllCustomers();
  const { data: leads, isLoading: leadsLoading } = useGetAllLeads();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'customer' as 'customer' | 'lead',
    selectedId: '',
    amount: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get contact details
    let contact;
    if (formData.type === 'customer') {
      contact = customers?.find(c => `${c.mobile}-${c.name}` === formData.selectedId);
    } else {
      contact = leads?.find(l => `${l.mobile}-${l.name}` === formData.selectedId);
    }

    if (!contact) {
      toast.error('Contact not found');
      return;
    }

    // Simulate invoice generation and WhatsApp sending
    const invoiceMessage = encodeURIComponent(
      `VR Homes Infra - Invoice\n\nTo: ${contact.name}\nAmount: ₹${formData.amount}\nDescription: ${formData.description}\n\nThank you for your business!`
    );
    
    window.open(`https://wa.me/${contact.mobile.replace(/\D/g, '')}?text=${invoiceMessage}`, '_blank');
    
    toast.success('Invoice sent via WhatsApp');
    setFormData({ type: 'customer', selectedId: '', amount: '', description: '' });
    setIsDialogOpen(false);
  };

  if (customersLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoice Management</h3>
          <p className="text-sm text-muted-foreground">Create and send invoices to customers and leads</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Generate an invoice and send it via WhatsApp</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Invoice For</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as 'customer' | 'lead', selectedId: '' })}
                  >
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
                  <Label htmlFor="selectedId">
                    Select {formData.type === 'customer' ? 'Customer' : 'Lead'}
                  </Label>
                  <Select value={formData.selectedId} onValueChange={(value) => setFormData({ ...formData, selectedId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${formData.type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'customer' ? (
                        customers?.map((customer) => (
                          <SelectItem key={`${customer.mobile}-${customer.name}`} value={`${customer.mobile}-${customer.name}`}>
                            {customer.name} ({customer.mobile})
                          </SelectItem>
                        ))
                      ) : (
                        leads?.map((lead) => (
                          <SelectItem key={`${lead.mobile}-${lead.name}`} value={`${lead.mobile}-${lead.name}`}>
                            {lead.name} ({lead.mobile})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Invoice description"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Generate & Send
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
          <CardDescription>
            Create invoices for customers or leads and automatically send them via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Click "Create Invoice" to generate a new invoice. The invoice will be automatically sent to the selected contact via WhatsApp.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

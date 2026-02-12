import { useGetCallerUserProfile, useGetCustomersByAgent, useGetLeadsByAgent } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageCircle, Phone, User, Clock, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AgentWhatsAppPanel() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: customers, isLoading: customersLoading } = useGetCustomersByAgent(userProfile?.mobile || '');
  const { data: leads, isLoading: leadsLoading } = useGetLeadsByAgent(userProfile?.mobile || '');

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is ${userProfile?.name} from VR Homes Infra.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const getContactStats = (mobile: string) => {
    // Simulated stats - in production, this would come from backend
    return {
      messageCount: Math.floor(Math.random() * 15),
      lastContacted: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
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
      <div>
        <h3 className="text-lg font-semibold">WhatsApp & Communication</h3>
        <p className="text-sm text-muted-foreground">Send messages and make calls to your customers and leads</p>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers">
            Customers ({customers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="leads">
            Leads ({leads?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                My Customers
              </CardTitle>
              <CardDescription>
                Contact your customers via WhatsApp or phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {!customers || customers.length === 0 ? (
                  <Alert>
                    <AlertDescription>No customers yet. Add customers to start communicating.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {customers.map((customer, index) => {
                      const stats = getContactStats(customer.mobile);
                      return (
                        <div key={`${customer.mobile}-${index}`} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-semibold">{customer.name}</h4>
                              <p className="text-sm text-muted-foreground">{customer.mobile}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{customer.requirement}</p>
                              <Badge variant={customer.followUpStatus === 'Pending' ? 'outline' : 'default'} className="text-xs">
                                {customer.followUpStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{stats.messageCount} messages</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Last: {stats.lastContacted}</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleWhatsApp(customer.mobile, customer.name)}
                            >
                              <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 flex items-center gap-2"
                              onClick={() => handleCall(customer.mobile)}
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                My Leads
              </CardTitle>
              <CardDescription>
                Contact your leads via WhatsApp or phone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {!leads || leads.length === 0 ? (
                  <Alert>
                    <AlertDescription>No leads yet. Add leads to start communicating.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead, index) => {
                      const stats = getContactStats(lead.mobile);
                      const hasRemarks = lead.remarks && lead.remarks.trim() !== '';
                      return (
                        <div key={`${lead.mobile}-${index}`} className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-semibold">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.mobile}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{lead.requirement}</p>
                              {hasRemarks && (
                                <p className="text-xs text-muted-foreground italic line-clamp-1">
                                  Remarks: {lead.remarks}
                                </p>
                              )}
                              <Badge variant={hasRemarks ? 'default' : 'outline'} className="text-xs">
                                {hasRemarks ? 'Updated' : 'Pending Remarks'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{stats.messageCount} messages</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Last: {stats.lastContacted}</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleWhatsApp(lead.mobile, lead.name)}
                            >
                              <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 flex items-center gap-2"
                              onClick={() => handleCall(lead.mobile)}
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

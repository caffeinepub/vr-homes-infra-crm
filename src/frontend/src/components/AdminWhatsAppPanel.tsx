import { useState } from 'react';
import { useGetApprovedAgents, useGetAllCustomers, useGetAllLeads } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageCircle, Phone, User, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminWhatsAppPanel() {
  const { data: agents, isLoading: agentsLoading } = useGetApprovedAgents();
  const { data: customers } = useGetAllCustomers();
  const { data: leads } = useGetAllLeads();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is VR Homes Infra CRM.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredCustomers = selectedAgent === 'all' 
    ? customers || []
    : (customers || []).filter(c => c.assignedAgent === selectedAgent);

  const filteredLeads = selectedAgent === 'all' 
    ? leads || []
    : (leads || []).filter(l => l.assignedAgent === selectedAgent);

  const getAgentName = (mobile: string) => {
    const agent = agents?.find(a => a.mobile === mobile);
    return agent?.name || mobile;
  };

  const getContactStats = (mobile: string) => {
    // Simulated stats - in production, this would come from backend
    return {
      messageCount: Math.floor(Math.random() * 20),
      lastContacted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WhatsApp Communication Center</h3>
          <p className="text-sm text-muted-foreground">View and manage all agent communications</p>
        </div>
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents?.map((agent) => (
              <SelectItem key={agent.mobile} value={agent.mobile}>
                {agent.name} ({agent.mobile})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customers
            </CardTitle>
            <CardDescription>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {filteredCustomers.length === 0 ? (
                <Alert>
                  <AlertDescription>No customers found for selected filter.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer, index) => {
                    const stats = getContactStats(customer.mobile);
                    return (
                      <div key={`${customer.mobile}-${index}`} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{customer.name}</h4>
                            <p className="text-sm text-muted-foreground">{customer.mobile}</p>
                            <Badge variant="outline" className="text-xs">
                              Agent: {getAgentName(customer.assignedAgent)}
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
                            variant="outline"
                            className="flex-1 flex items-center gap-2"
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

        {/* Leads Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Leads
            </CardTitle>
            <CardDescription>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {filteredLeads.length === 0 ? (
                <Alert>
                  <AlertDescription>No leads found for selected filter.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead, index) => {
                    const stats = getContactStats(lead.mobile);
                    return (
                      <div key={`${lead.mobile}-${index}`} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{lead.name}</h4>
                            <p className="text-sm text-muted-foreground">{lead.mobile}</p>
                            <Badge variant="outline" className="text-xs">
                              Agent: {getAgentName(lead.assignedAgent)}
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
                            variant="outline"
                            className="flex-1 flex items-center gap-2"
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
      </div>
    </div>
  );
}

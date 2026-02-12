import { useMemo } from 'react';
import { useGetAllAgentProfiles, useGetAllLeads } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, UserCheck, Target, ArrowRight, Phone } from 'lucide-react';
import { isPending, isApproved } from '../utils/approvalStatus';
import { LeadStatus } from '../backend';
import type { Lead } from '../types';

type TabValue = 'overview' | 'pending' | 'approved' | 'customers' | 'leads' | 'followups' | 'invoices' | 'whatsapp';

interface AdminOverviewPanelProps {
  onNavigate: (tab: TabValue, statusFilter?: LeadStatus) => void;
}

export default function AdminOverviewPanel({ onNavigate }: AdminOverviewPanelProps) {
  const { data: allAgents, isLoading: agentsLoading } = useGetAllAgentProfiles();
  const { data: allLeads, isLoading: leadsLoading } = useGetAllLeads();

  const stats = useMemo(() => {
    const pendingAgents = allAgents?.filter(agent => isPending(agent.status)) || [];
    const approvedAgents = allAgents?.filter(agent => isApproved(agent.status)) || [];
    
    const leadsByStatus = {
      new: allLeads?.filter(lead => lead.status === LeadStatus.new_) || [],
      converted: allLeads?.filter(lead => lead.status === LeadStatus.converted) || [],
      lost: allLeads?.filter(lead => lead.status === LeadStatus.lost) || [],
      goingOn: allLeads?.filter(lead => lead.status === LeadStatus.going_on) || [],
    };

    return {
      pendingAgents,
      approvedAgents,
      leadsByStatus,
    };
  }, [allAgents, allLeads]);

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.new_: return 'New';
      case LeadStatus.converted: return 'Converted';
      case LeadStatus.lost: return 'Lost';
      case LeadStatus.going_on: return 'Going On';
      default: return status;
    }
  };

  const handleWhatsApp = (mobile: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, this is VR Homes Infra CRM.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  if (agentsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Agents Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to review pending registrations
            </p>
          </CardContent>
        </Card>

        {/* Approved Agents Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('approved')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view all agents
            </p>
          </CardContent>
        </Card>

        {/* New Leads Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('leads', LeadStatus.new_)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsByStatus.new.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view new leads
            </p>
          </CardContent>
        </Card>

        {/* Going On Leads Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('leads', LeadStatus.going_on)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Going On</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsByStatus.goingOn.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view ongoing leads
            </p>
          </CardContent>
        </Card>

        {/* Converted Leads Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('leads', LeadStatus.converted)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsByStatus.converted.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view converted leads
            </p>
          </CardContent>
        </Card>

        {/* Lost Leads Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
          onClick={() => onNavigate('leads', LeadStatus.lost)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsByStatus.lost.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view lost leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Agents Mini List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Pending Agents</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('pending')}
              className="flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.pendingAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending agents
              </p>
            ) : (
              <div className="space-y-3">
                {stats.pendingAgents.slice(0, 5).map((agent) => (
                  <div 
                    key={agent.mobile} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.mobile}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
                {stats.pendingAgents.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.pendingAgents.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Leads Mini List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent New Leads</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('leads', LeadStatus.new_)}
              className="flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.leadsByStatus.new.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No new leads
              </p>
            ) : (
              <div className="space-y-3">
                {stats.leadsByStatus.new.slice(0, 5).map((lead, index) => {
                  const agent = stats.approvedAgents.find(a => a.mobile === lead.assignedAgent);
                  return (
                    <div 
                      key={`${lead.mobile}-${index}`} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.mobile}</p>
                        <p className="text-xs text-muted-foreground">Agent: {agent?.name || lead.assignedAgent}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(lead.mobile, lead.name);
                          }}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(lead.mobile);
                          }}
                          title="Make phone call"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {stats.leadsByStatus.new.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.leadsByStatus.new.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Going On Leads Mini List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Going On Leads</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('leads', LeadStatus.going_on)}
              className="flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.leadsByStatus.goingOn.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ongoing leads
              </p>
            ) : (
              <div className="space-y-3">
                {stats.leadsByStatus.goingOn.slice(0, 5).map((lead, index) => {
                  const agent = stats.approvedAgents.find(a => a.mobile === lead.assignedAgent);
                  return (
                    <div 
                      key={`${lead.mobile}-${index}`} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.mobile}</p>
                        <p className="text-xs text-muted-foreground">Agent: {agent?.name || lead.assignedAgent}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(lead.mobile, lead.name);
                          }}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(lead.mobile);
                          }}
                          title="Make phone call"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {stats.leadsByStatus.goingOn.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.leadsByStatus.goingOn.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Converted Leads Mini List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Converted Leads</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('leads', LeadStatus.converted)}
              className="flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.leadsByStatus.converted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No converted leads
              </p>
            ) : (
              <div className="space-y-3">
                {stats.leadsByStatus.converted.slice(0, 5).map((lead, index) => {
                  const agent = stats.approvedAgents.find(a => a.mobile === lead.assignedAgent);
                  return (
                    <div 
                      key={`${lead.mobile}-${index}`} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.mobile}</p>
                        <p className="text-xs text-muted-foreground">Agent: {agent?.name || lead.assignedAgent}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(lead.mobile, lead.name);
                          }}
                          title="Send WhatsApp message"
                        >
                          <img src="/assets/generated/whatsapp-chat-icon-transparent.dim_32x32.png" alt="WhatsApp" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(lead.mobile);
                          }}
                          title="Make phone call"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {stats.leadsByStatus.converted.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.leadsByStatus.converted.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

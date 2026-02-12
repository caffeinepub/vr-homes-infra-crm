import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorStable } from './useActorStable';
import type { ApprovalStatus, Requirement, LeadRequirement, LeadStatus, AgentProfile } from '../backend';
import type { UserProfile, Customer, Lead, FollowUp, Time } from '../types';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile(options?: { enabled?: boolean }) {
  const { actor, isLoading: actorLoading } = useActorStable();
  const enabled = options?.enabled ?? true;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: enabled && !!actor && !actorLoading,
    retry: false,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    isLoading: actorLoading || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

// Admin Queries
export function useIsAdmin(options?: { enabled?: boolean }) {
  const { actor, isLoading: actorLoading } = useActorStable();
  const enabled = options?.enabled ?? true;

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: enabled && !!actor && !actorLoading,
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Agent approval status check
export function useIsCallerApproved() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorLoading,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

// Get current agent profile (requires approval)
export function useGetAgentProfileByCaller() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<AgentProfile | null>({
    queryKey: ['agentProfileByCaller'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getAgentProfileByCaller();
      } catch (error) {
        // Return null if not approved or not an agent
        return null;
      }
    },
    enabled: !!actor && !actorLoading,
    retry: false,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export function useGetPendingAgents() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<AgentProfile[]>({
    queryKey: ['pendingAgents'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const approvals = await actor.listApprovals();
      // Filter for pending approvals and map to AgentProfile format
      return approvals
        .filter(a => a.status === 'pending')
        .map(a => ({
          name: '',
          mobile: '',
          email: '',
          faceEmbeddings: new Uint8Array(),
          status: a.status,
          principal: a.principal,
        }));
    },
    enabled: !!actor && !actorLoading,
    staleTime: 10000, // 10 seconds
  });
}

export function useGetApprovedAgents() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<AgentProfile[]>({
    queryKey: ['approvedAgents'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const approvals = await actor.listApprovals();
      // Filter for approved agents
      return approvals
        .filter(a => a.status === 'approved')
        .map(a => ({
          name: '',
          mobile: '',
          email: '',
          faceEmbeddings: new Uint8Array(),
          status: a.status,
          principal: a.principal,
        }));
    },
    enabled: !!actor && !actorLoading,
    staleTime: 10000, // 10 seconds
  });
}

export function useSetApproval() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ principal, status }: { principal: string; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(principal as any, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAgents'] });
      queryClient.invalidateQueries({ queryKey: ['approvedAgents'] });
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      toast.success('Agent status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update agent status');
    },
  });
}

// Agent Registration and Login
export function useRegisterAgent() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      email,
      faceEmbeddings,
    }: {
      name: string;
      mobile: string;
      email: string;
      faceEmbeddings: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerAgent(name, mobile, email, faceEmbeddings);
    },
    onSuccess: () => {
      // Invalidate all agent-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['pendingAgents'] });
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['agentLoginTimes'] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

export function useLoginAgent() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ faceEmbeddings }: { faceEmbeddings: Uint8Array }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.loginAgent(faceEmbeddings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentLoginTimes'] });
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['agentProfileByCaller'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
    onError: (error: Error) => {
      throw error;
    },
  });
}

export function useLogoutAgent() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.logoutAgent();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentLoginTimes'] });
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['agentProfileByCaller'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to logout');
    },
  });
}

export function useGetAllAgentProfiles() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<AgentProfile[]>({
    queryKey: ['allAgentProfiles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const profiles = await actor.getAllAgentProfiles();
      return profiles;
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

export function useGetAgentLoginTimesAndStatus() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<Array<[string, bigint, boolean]>>({
    queryKey: ['agentLoginTimes'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAgentLoginTimesAndStatus();
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

export function useApproveAgent() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveAgent(mobile);
    },
    onSuccess: () => {
      // Invalidate and refetch all agent-related queries
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAgents'] });
      queryClient.invalidateQueries({ queryKey: ['approvedAgents'] });
      queryClient.invalidateQueries({ queryKey: ['agentLoginTimes'] });
      toast.success('Agent approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve agent');
    },
  });
}

export function useRejectAgent() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectAgent(mobile);
    },
    onSuccess: () => {
      // Invalidate and refetch all agent-related queries
      queryClient.invalidateQueries({ queryKey: ['allAgentProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['pendingAgents'] });
      queryClient.invalidateQueries({ queryKey: ['approvedAgents'] });
      queryClient.invalidateQueries({ queryKey: ['agentLoginTimes'] });
      toast.success('Agent rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject agent');
    },
  });
}

// Customer Management Queries
export function useGetAllCustomers() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<Customer[]>({
    queryKey: ['allCustomers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getCustomers();
      return entries.map(([_, customer]) => customer);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30000, // 30 seconds
  });
}

export function useGetCustomersByAgent(agentMobile: string) {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<Customer[]>({
    queryKey: ['customersByAgent', agentMobile],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getCustomers();
      return entries.map(([_, customer]) => customer);
    },
    enabled: !!actor && !actorLoading && !!agentMobile,
    staleTime: 30000, // 30 seconds
  });
}

export function useAddCustomer() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      email,
      requirement,
      assignedAgent,
      followUpStatus,
    }: {
      name: string;
      mobile: string;
      email?: string;
      requirement: Requirement;
      assignedAgent: string;
      followUpStatus: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomer(name, mobile, email || null, requirement, assignedAgent, followUpStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customersByAgent'] });
      queryClient.invalidateQueries({ queryKey: ['allCustomers'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add customer');
    },
  });
}

// Lead Management Queries
export function useGetAllLeads() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<Lead[]>({
    queryKey: ['allLeads'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getLeads();
      return entries.map(([_, lead]) => lead);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30000, // 30 seconds
  });
}

export function useGetLeadsByAgent(agentMobile: string) {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<Lead[]>({
    queryKey: ['leadsByAgent', agentMobile],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getLeads();
      return entries.map(([_, lead]) => lead);
    },
    enabled: !!actor && !actorLoading && !!agentMobile,
    staleTime: 30000, // 30 seconds
  });
}

export function useAddLead() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      email,
      status,
      requirement,
      description,
      assignedAgent,
      remarks,
    }: {
      name: string;
      mobile: string;
      email?: string;
      status: LeadStatus;
      requirement: LeadRequirement;
      description: string;
      assignedAgent: string;
      remarks?: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(
        name,
        mobile,
        email || null,
        status,
        requirement,
        assignedAgent,
        description,
        remarks || null,
        null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadsByAgent'] });
      queryClient.invalidateQueries({ queryKey: ['allLeads'] });
      toast.success('Lead added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add lead');
    },
  });
}

// Follow-up Management Queries
export function useGetAllFollowUps() {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<FollowUp[]>({
    queryKey: ['allFollowUps'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getFollowUps();
      return entries.map(([_, followUp]) => ({
        ...followUp,
        type: followUp.type,
      }));
    },
    enabled: !!actor && !actorLoading,
    staleTime: 30000, // 30 seconds
  });
}

export function useGetFollowUpsByAgent(agentMobile: string) {
  const { actor, isLoading: actorLoading } = useActorStable();

  return useQuery<FollowUp[]>({
    queryKey: ['followUpsByAgent', agentMobile],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const entries = await actor.getFollowUps();
      return entries.map(([_, followUp]) => ({
        ...followUp,
        type: followUp.type,
      }));
    },
    enabled: !!actor && !actorLoading && !!agentMobile,
    staleTime: 30000, // 30 seconds
  });
}

export function useAddFollowUp() {
  const { actor } = useActorStable();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      linkedId,
      type,
      agent,
      followUpTime,
      remarks,
      status,
    }: {
      linkedId: string;
      type: string;
      agent: string;
      followUpTime: Time;
      remarks: string;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFollowUp(linkedId, type, agent, followUpTime, remarks, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUpsByAgent'] });
      queryClient.invalidateQueries({ queryKey: ['allFollowUps'] });
      toast.success('Follow-up added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add follow-up');
    },
  });
}

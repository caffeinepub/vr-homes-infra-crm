// Local type definitions for frontend use
// These types mirror the backend structure but are defined locally
// since the backend interface doesn't export them

import type { Requirement, LeadRequirement, LeadStatus, AgentProfile as BackendAgentProfile } from '../backend';
import type { Principal } from '@dfinity/principal';

export type Time = bigint;

export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
}

// Use the backend AgentProfile type directly to avoid type conflicts
export type AgentProfile = BackendAgentProfile;

export interface Customer {
  name: string;
  mobile: string;
  email?: string;
  requirement: Requirement;
  assignedAgent: string;
  followUpStatus: string;
  createdAt: bigint;
}

export interface Lead {
  name: string;
  mobile: string;
  email?: string;
  status: LeadStatus;
  requirement: LeadRequirement;
  assignedAgent: string;
  description: string;
  remarks?: string;
  createdAt: Time;
  remarksTimestamp?: Time;
}

export interface FollowUp {
  id: string;
  linkedId: string;
  type: string;
  agent: string;
  followUpTime: Time;
  remarks: string;
  status: string;
  createdAt: Time;
}

export { Requirement, LeadRequirement, LeadStatus };

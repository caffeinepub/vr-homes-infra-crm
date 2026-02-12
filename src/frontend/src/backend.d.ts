import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface CallLog {
    id: string;
    duration: bigint;
    callType: string;
    participant: ChatParticipant;
    timestamp: Time;
}
export interface WhatsAppMessage {
    id: string;
    status: MessageStatus;
    direction: MessageDirection;
    content: string;
    participant: ChatParticipant;
    messageType: string;
    timestamp: Time;
}
export interface Customer {
    assignedAgent: string;
    name: string;
    createdAt: bigint;
    email?: string;
    requirement: Requirement;
    mobile: string;
    followUpStatus: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Lead {
    status: LeadStatus;
    assignedAgent: string;
    name: string;
    createdAt: Time;
    description: string;
    email?: string;
    requirement: LeadRequirement;
    remarksTimestamp?: Time;
    mobile: string;
    remarks?: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type ChatParticipant = {
    __kind__: "agent";
    agent: string;
} | {
    __kind__: "customer";
    customer: string;
} | {
    __kind__: "lead";
    lead: string;
};
export type FaceEmbeddings = Uint8Array;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface FollowUp {
    id: string;
    followUpTime: Time;
    status: string;
    linkedId: string;
    agent: string;
    createdAt: Time;
    type: string;
    remarks: string;
}
export interface UserProfile {
    name: string;
    email: string;
    mobile: string;
}
export interface AgentProfile {
    status: ApprovalStatus;
    faceEmbeddings: FaceEmbeddings;
    principal: Principal;
    name: string;
    email: string;
    mobile: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum LeadRequirement {
    Fully_furnished_flat = "Fully_furnished_flat",
    RWA_flat = "RWA_flat",
    Semi_furnished_flat = "Semi_furnished_flat"
}
export enum LeadStatus {
    new_ = "new",
    lost = "lost",
    going_on = "going_on",
    converted = "converted"
}
export enum MessageDirection {
    sent = "sent",
    received = "received"
}
export enum MessageStatus {
    pending = "pending",
    read = "read",
    delivered = "delivered"
}
export enum Requirement {
    Interior = "Interior",
    Fully_furnished_flat = "Fully_furnished_flat",
    Rent = "Rent",
    Sell = "Sell",
    RWA_flat = "RWA_flat",
    Purchase = "Purchase",
    Semi_furnished_flat = "Semi_furnished_flat"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCallLog(participant: ChatParticipant, duration: bigint, callType: string): Promise<string>;
    addCustomer(name: string, mobile: string, email: string | null, requirement: Requirement, assignedAgent: string, followUpStatus: string): Promise<string>;
    addFollowUp(linkedId: string, type: string, agent: string, followUpTime: Time, remarks: string, status: string): Promise<string>;
    addLead(name: string, mobile: string, email: string | null, status: LeadStatus, requirement: LeadRequirement, assignedAgent: string, description: string, remarks: string | null, remarksTimestamp: bigint | null): Promise<string>;
    addWhatsAppMessage(participant: ChatParticipant, content: string, direction: MessageDirection, messageType: string, status: MessageStatus): Promise<string>;
    approveAgent(mobile: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAgent(mobile: string): Promise<void>;
    deleteFollowUp(followUpId: string): Promise<void>;
    getAgentLoginTimesAndStatus(): Promise<Array<[string, Time, boolean]>>;
    getAgentProfileByCaller(): Promise<AgentProfile>;
    getAllAgentProfiles(): Promise<Array<AgentProfile>>;
    getCallLogs(): Promise<Array<[string, CallLog]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomers(): Promise<Array<[string, Customer]>>;
    getFollowUps(): Promise<Array<[string, FollowUp]>>;
    getLeads(): Promise<Array<[string, Lead]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWhatsAppMessages(): Promise<Array<[string, WhatsAppMessage]>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    loginAgent(faceEmbeddings: Uint8Array): Promise<void>;
    logoutAgent(): Promise<void>;
    makeHttpGetRequest(url: string): Promise<string>;
    registerAgent(name: string, mobile: string, email: string, faceEmbeddings: Uint8Array): Promise<void>;
    rejectAgent(mobile: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAgentProfile(mobile: string, name: string, email: string): Promise<void>;
    updateFollowUp(followUpId: string, remarks: string, status: string): Promise<void>;
}

import { ApprovalStatus } from '../backend';

/**
 * Normalize approval status from backend to a consistent string format.
 * Handles both string enums and Candid variant object shapes.
 */
export function normalizeApprovalStatus(status: any): 'pending' | 'approved' | 'rejected' {
  // Handle string enum
  if (typeof status === 'string') {
    return status as 'pending' | 'approved' | 'rejected';
  }
  
  // Handle Candid variant object shape (e.g., { pending: null } or { approved: null })
  if (typeof status === 'object' && status !== null) {
    if ('pending' in status) return 'pending';
    if ('approved' in status) return 'approved';
    if ('rejected' in status) return 'rejected';
  }
  
  // Fallback
  return 'pending';
}

/**
 * Check if an agent status is pending
 */
export function isPending(status: any): boolean {
  return normalizeApprovalStatus(status) === 'pending';
}

/**
 * Check if an agent status is approved
 */
export function isApproved(status: any): boolean {
  return normalizeApprovalStatus(status) === 'approved';
}

/**
 * Check if an agent status is rejected
 */
export function isRejected(status: any): boolean {
  return normalizeApprovalStatus(status) === 'rejected';
}
